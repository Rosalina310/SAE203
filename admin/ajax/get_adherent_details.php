<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

// Définir le type de contenu JSON
header('Content-Type: application/json');

// Vérifier que c'est une requête GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupération de l'ID de l'adhérent
    $adherentId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    
    if (!$adherentId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'adhérent invalide']);
        exit;
    }
    
    // Récupérer les détails de l'adhérent
    $adherent = getAdherentById($adherentId);
    
    if (!$adherent) {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $adherent['id'],
            'nom' => $adherent['Nom'],
            'prenom' => $adherent['Prenom'],
            'email' => $adherent['Email'],
            'statut' => $adherent['Statut']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération détails adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>