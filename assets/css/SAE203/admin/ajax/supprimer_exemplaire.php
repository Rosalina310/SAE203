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
    
    // Récupération de l'ID de l'exemplaire
    $exemplaireId = filter_var($input['exemplaire_id'] ?? 0, FILTER_VALIDATE_INT);
    
    if (!$exemplaireId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'exemplaire invalide']);
        exit;
    }
    
    // Vérifier que l'exemplaire existe et est disponible
    $stmt = $connexion->prepare("
        SELECT ex.*, m.Titre as media_titre
        FROM exemplaire ex
        JOIN media m ON ex.media_id = m.id
        WHERE ex.id = :exemplaire_id
    ");
    $stmt->bindParam(':exemplaire_id', $exemplaireId, PDO::PARAM_INT);
    $stmt->execute();
    $exemplaire = $stmt->fetch();
    
    if (!$exemplaire) {
        echo json_encode(['success' => false, 'message' => 'Exemplaire introuvable']);
        exit;
    }
    
    // Vérifier que l'exemplaire n'est pas emprunté
    if (!$exemplaire['disponible']) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer un exemplaire emprunté']);
        exit;
    }
    
    // Vérifier qu'il restera au moins un exemplaire après suppression
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as nb_exemplaires 
        FROM exemplaire 
        WHERE media_id = :media_id
    ");
    $stmt->bindParam(':media_id', $exemplaire['media_id'], PDO::PARAM_INT);
    $stmt->execute();
    $nbExemplaires = $stmt->fetch()['nb_exemplaires'];
    
    if ($nbExemplaires <= 1) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer le dernier exemplaire']);
        exit;
    }
    
    // Supprimer l'exemplaire
    $stmt = $connexion->prepare("DELETE FROM exemplaire WHERE id = :exemplaire_id");
    $stmt->bindParam(':exemplaire_id', $exemplaireId, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => "Exemplaire #{$exemplaire['numero_exemplaire']} supprimé avec succès",
            'data' => [
                'exemplaire_id' => $exemplaireId,
                'numero' => $exemplaire['numero_exemplaire'],
                'media_titre' => $exemplaire['media_titre']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
    }
    
} catch (Exception $e) {
    error_log("Erreur suppression exemplaire AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>