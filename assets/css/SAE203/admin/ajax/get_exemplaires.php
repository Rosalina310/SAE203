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
    // Récupération de l'ID du média
    $mediaId = filter_input(INPUT_GET, 'media_id', FILTER_VALIDATE_INT);
    
    if (!$mediaId) {
        echo json_encode(['success' => false, 'message' => 'ID de média invalide']);
        exit;
    }
    
    // Vérifier que le média existe
    $stmt = $connexion->prepare("SELECT Titre, Auteur FROM media WHERE id = :media_id");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $media = $stmt->fetch();
    
    if (!$media) {
        echo json_encode(['success' => false, 'message' => 'Média introuvable']);
        exit;
    }
    
    // Récupérer tous les exemplaires avec les informations d'emprunt
    $stmt = $connexion->prepare("
        SELECT ex.*, 
               CASE 
                   WHEN ex.disponible = 0 THEN CONCAT(a.Prenom, ' ', a.Nom)
                   ELSE NULL
               END as emprunteur,
               CASE 
                   WHEN ex.disponible = 0 THEN e.Date_Retour_Prévue
                   ELSE NULL
               END as date_retour_prevue
        FROM exemplaire ex
        LEFT JOIN emprunt e ON ex.id = e.exemplaire_id AND e.Statut_Emprunt IN ('emprunté', 'en retard')
        LEFT JOIN adherent a ON e.adherent_id = a.id
        WHERE ex.media_id = :media_id
        ORDER BY ex.numero_exemplaire
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $exemplaires = $stmt->fetchAll();
    
    // Formater les données
    $exemplairesList = [];
    foreach ($exemplaires as $ex) {
        $exemplairesList[] = [
            'id' => $ex['id'],
            'numero' => $ex['numero_exemplaire'],
            'etat' => ucfirst($ex['etat_conservation']),
            'disponible' => (bool)$ex['disponible'],
            'date_acquisition' => $ex['date_acquisition'] ? format_date_fr($ex['date_acquisition']) : null,
            'emprunteur' => $ex['emprunteur'],
            'date_retour_prevue' => $ex['date_retour_prevue'] ? format_date_fr($ex['date_retour_prevue']) : null
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'media_id' => $mediaId,
            'media_titre' => $media['Titre'] . ' - ' . $media['Auteur'],
            'exemplaires' => $exemplairesList
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération exemplaires AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>