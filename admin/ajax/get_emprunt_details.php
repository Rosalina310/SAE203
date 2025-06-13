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
    // Récupération de l'ID de l'emprunt
    $empruntId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    
    if (!$empruntId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'emprunt invalide']);
        exit;
    }
    
    // Récupérer les détails de l'emprunt
    $stmt = $connexion->prepare("
        SELECT e.*, m.Titre, m.Auteur,
               CONCAT(a.Prenom, ' ', a.Nom) as emprunteur,
               a.Email as emprunteur_email,
               ex.numero_exemplaire,
               t.Nom as type_media,
               DATEDIFF(CURDATE(), e.Date_Retour_Prévue) as jours_retard
        FROM emprunt e
        JOIN media m ON e.media_id = m.id
        JOIN adherent a ON e.adherent_id = a.id
        JOIN exemplaire ex ON e.exemplaire_id = ex.id
        JOIN type t ON m.type_id = t.id
        WHERE e.ID_Emprunt = :emprunt_id
    ");
    $stmt->bindParam(':emprunt_id', $empruntId, PDO::PARAM_INT);
    $stmt->execute();
    $emprunt = $stmt->fetch();
    
    if (!$emprunt) {
        echo json_encode(['success' => false, 'message' => 'Emprunt introuvable']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id_emprunt' => $emprunt['ID_Emprunt'],
            'titre' => $emprunt['Titre'],
            'auteur' => $emprunt['Auteur'],
            'type_media' => $emprunt['type_media'],
            'numero_exemplaire' => $emprunt['numero_exemplaire'],
            'emprunteur' => $emprunt['emprunteur'],
            'emprunteur_email' => $emprunt['emprunteur_email'],
            'date_emprunt' => format_date_fr($emprunt['Date_Emprunt']),
            'date_retour_prevue' => format_date_fr($emprunt['Date_Retour_Prévue']),
            'statut' => $emprunt['Statut_Emprunt'],
            'jours_retard' => max(0, $emprunt['jours_retard'])
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération détails emprunt AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>