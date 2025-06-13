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
    $stmt = $connexion->prepare("
        SELECT m.*, t.Nom as type_nom 
        FROM media m 
        JOIN type t ON m.type_id = t.id 
        WHERE m.id = :media_id
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $media = $stmt->fetch();
    
    if (!$media) {
        echo json_encode(['success' => false, 'message' => 'Média introuvable']);
        exit;
    }
    
    // Trouver le prochain numéro d'exemplaire
    $stmt = $connexion->prepare("
        SELECT MAX(numero_exemplaire) as max_numero 
        FROM exemplaire 
        WHERE media_id = :media_id
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetch();
    $nouveauNumero = ($result['max_numero'] ?? 0) + 1;
    
    // Limiter le nombre d'exemplaires (sécurité)
    if ($nouveauNumero > 50) {
        echo json_encode(['success' => false, 'message' => 'Nombre maximum d\'exemplaires atteint (50)']);
        exit;
    }
    
    // Insérer le nouvel exemplaire
    $stmt = $connexion->prepare("
        INSERT INTO exemplaire (media_id, numero_exemplaire, etat_conservation, disponible, date_acquisition) 
        VALUES (:media_id, :numero, :etat, 1, CURDATE())
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->bindParam(':numero', $nouveauNumero, PDO::PARAM_INT);
    $stmt->bindParam(':etat', $media['etat_Conservation']);
    
    if ($stmt->execute()) {
        $exemplaireId = $connexion->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => "Exemplaire #{$nouveauNumero} ajouté avec succès",
            'data' => [
                'exemplaire_id' => $exemplaireId,
                'numero' => $nouveauNumero,
                'media_titre' => $media['Titre'],
                'type' => $media['type_nom']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de l\'exemplaire']);
    }
    
} catch (Exception $e) {
    error_log("Erreur ajout exemplaire AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>