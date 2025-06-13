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
    
    // Récupération de l'ID de l'emprunt
    $empruntId = filter_var($input['emprunt_id'] ?? 0, FILTER_VALIDATE_INT);
    
    if (!$empruntId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'emprunt invalide']);
        exit;
    }
    
    // Vérifier que l'emprunt existe et peut être rendu
    $stmt = $connexion->prepare("
        SELECT e.*, m.Titre, CONCAT(a.Prenom, ' ', a.Nom) as emprunteur
        FROM emprunt e
        JOIN media m ON e.media_id = m.id
        JOIN adherent a ON e.adherent_id = a.id
        WHERE e.ID_Emprunt = :emprunt_id
        AND e.Statut_Emprunt IN ('emprunté', 'en retard')
    ");
    $stmt->bindParam(':emprunt_id', $empruntId, PDO::PARAM_INT);
    $stmt->execute();
    $emprunt = $stmt->fetch();
    
    if (!$emprunt) {
        echo json_encode(['success' => false, 'message' => 'Emprunt introuvable ou déjà rendu']);
        exit;
    }
    
    // Utiliser la procédure stockée pour le retour
    $resultat = retournerEmprunt($empruntId);
    
    if ($resultat) {
        echo json_encode([
            'success' => true,
            'message' => "Retour effectué avec succès pour \"{$emprunt['Titre']}\"",
            'data' => [
                'emprunt_id' => $empruntId,
                'titre' => $emprunt['Titre'],
                'emprunteur' => $emprunt['emprunteur'],
                'date_retour_effectif' => date('d/m/Y')
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors du retour de l\'emprunt']);
    }
    
} catch (Exception $e) {
    error_log("Erreur retour emprunt AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>