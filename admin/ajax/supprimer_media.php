<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

// Définir le type de contenu JSON
header('Content-Type: application/json');

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupérer les données JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
        exit;
    }
    
    // Vérification du token CSRF
    if (!isset($input['csrf_token']) || !verify_csrf_token($input['csrf_token'])) {
        echo json_encode(['success' => false, 'message' => 'Token CSRF invalide']);
        exit;
    }
    
    // Récupération de l'ID du média
    $mediaId = filter_var($input['media_id'] ?? 0, FILTER_VALIDATE_INT);
    
    if (!$mediaId) {
        echo json_encode(['success' => false, 'message' => 'ID de média invalide']);
        exit;
    }
    
    // Vérifier que le média existe
    $stmt = $connexion->prepare("SELECT * FROM media WHERE id = :media_id");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $media = $stmt->fetch();
    
    if (!$media) {
        echo json_encode(['success' => false, 'message' => 'Média introuvable']);
        exit;
    }
    
    // Vérifier qu'aucun exemplaire n'est emprunté
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as nb_empruntes 
        FROM exemplaire 
        WHERE media_id = :media_id AND disponible = 0
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $nbEmpruntes = $stmt->fetch()['nb_empruntes'];
    
    if ($nbEmpruntes > 0) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer : certains exemplaires sont encore empruntés']);
        exit;
    }
    
    // Commencer une transaction
    $connexion->beginTransaction();
    
    try {
        // Supprimer d'abord tous les exemplaires
        $stmt = $connexion->prepare("DELETE FROM exemplaire WHERE media_id = :media_id");
        $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Supprimer les emprunts historiques (statut 'rendu')
        $stmt = $connexion->prepare("DELETE FROM emprunt WHERE media_id = :media_id AND Statut_Emprunt = 'rendu'");
        $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Supprimer le média
        $stmt = $connexion->prepare("DELETE FROM media WHERE id = :media_id");
        $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Valider la transaction
        $connexion->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Média \"{$media['Titre']}\" supprimé définitivement",
            'data' => [
                'media_id' => $mediaId,
                'titre' => $media['Titre'],
                'auteur' => $media['Auteur']
            ]
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $connexion->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Erreur suppression média AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la suppression']);
}
?>