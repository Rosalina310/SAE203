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
    $mediaId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    
    if (!$mediaId) {
        echo json_encode(['success' => false, 'message' => 'ID de média invalide']);
        exit;
    }
    
    // Récupérer les détails du média
    $stmt = $connexion->prepare("
        SELECT m.*, t.Nom as type_nom,
               COUNT(ex.id) as total_exemplaires,
               SUM(CASE WHEN ex.disponible = 1 THEN 1 ELSE 0 END) as exemplaires_disponibles,
               SUM(CASE WHEN ex.disponible = 0 THEN 1 ELSE 0 END) as exemplaires_empruntes
        FROM media m
        LEFT JOIN type t ON m.type_id = t.id
        LEFT JOIN exemplaire ex ON m.id = ex.media_id
        WHERE m.id = :media_id
        GROUP BY m.id
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $media = $stmt->fetch();
    
    if (!$media) {
        echo json_encode(['success' => false, 'message' => 'Média introuvable']);
        exit;
    }
    
    // Récupérer la liste des exemplaires avec leurs détails
    $stmt = $connexion->prepare("
        SELECT ex.*, 
               CASE 
                   WHEN ex.disponible = 0 THEN CONCAT(a.Prenom, ' ', a.Nom)
                   ELSE NULL
               END as emprunteur
        FROM exemplaire ex
        LEFT JOIN emprunt e ON ex.id = e.exemplaire_id AND e.Statut_Emprunt IN ('emprunté', 'en retard')
        LEFT JOIN adherent a ON e.adherent_id = a.id
        WHERE ex.media_id = :media_id
        ORDER BY ex.numero_exemplaire
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $exemplaires = $stmt->fetchAll();
    
    // Formater les données des exemplaires
    $exemplairesList = [];
    foreach ($exemplaires as $ex) {
        $exemplairesList[] = [
            'id' => $ex['id'],
            'numero' => $ex['numero_exemplaire'],
            'etat' => ucfirst($ex['etat_conservation']),
            'disponible' => (bool)$ex['disponible'],
            'date_acquisition' => $ex['date_acquisition'] ? format_date_fr($ex['date_acquisition']) : null,
            'emprunteur' => $ex['emprunteur']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $media['id'],
            'titre' => $media['Titre'],
            'auteur' => $media['Auteur'],
            'editeur' => $media['Editeur'],
            'date_parution' => $media['Date_Parution'],
            'genre' => $media['Genre'],
            'etat_conservation' => ucfirst($media['etat_Conservation']),
            'type_nom' => $media['type_nom'],
            'total_exemplaires' => (int)$media['total_exemplaires'],
            'exemplaires_disponibles' => (int)$media['exemplaires_disponibles'],
            'exemplaires_empruntes' => (int)$media['exemplaires_empruntes'],
            'exemplaires' => $exemplairesList
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération détails média AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>