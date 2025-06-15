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
    
    // Récupération de l'ID de l'adhérent
    $adherentId = filter_var($input['adherent_id'] ?? 0, FILTER_VALIDATE_INT);
    
    if (!$adherentId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'adhérent invalide']);
        exit;
    }
    
    // Vérifier que l'adhérent existe
    $adherent = getAdherentById($adherentId);
    if (!$adherent) {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable']);
        exit;
    }
    
    // Vérifier qu'il n'y a pas d'emprunts actifs
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as nb_emprunts_actifs 
        FROM emprunt 
        WHERE adherent_id = :adherent_id 
        AND Statut_Emprunt IN ('emprunté', 'en retard')
    ");
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    $stmt->execute();
    $nbEmpruntsActifs = $stmt->fetch()['nb_emprunts_actifs'];
    
    if ($nbEmpruntsActifs > 0) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer un adhérent avec des emprunts en cours']);
        exit;
    }
    
    // Commencer une transaction pour supprimer en cascade
    $connexion->beginTransaction();
    
    try {
        // Supprimer d'abord tous les emprunts historiques (rendus)
        $stmt = $connexion->prepare("DELETE FROM emprunt WHERE adherent_id = :adherent_id AND Statut_Emprunt = 'rendu'");
        $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Supprimer l'adhérent
        $stmt = $connexion->prepare("DELETE FROM adherent WHERE id = :adherent_id");
        $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Valider la transaction
        $connexion->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Adhérent {$adherent['Prenom']} {$adherent['Nom']} supprimé définitivement",
            'data' => [
                'adherent_id' => $adherentId,
                'nom_complet' => $adherent['Prenom'] . ' ' . $adherent['Nom']
            ]
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $connexion->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Erreur suppression adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la suppression']);
}
?>