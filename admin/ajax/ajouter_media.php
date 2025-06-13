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
    // Vérification du token CSRF
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        echo json_encode(['success' => false, 'message' => 'Token CSRF invalide']);
        exit;
    }
    
    // Récupération et nettoyage des données
    $titre = cleanInput($_POST['titre'] ?? '');
    $auteur = cleanInput($_POST['auteur'] ?? '');
    $editeur = cleanInput($_POST['editeur'] ?? '');
    $dateParution = cleanInput($_POST['date_parution'] ?? '');
    $genre = cleanInput($_POST['genre'] ?? '');
    $typeId = filter_input(INPUT_POST, 'type_id', FILTER_VALIDATE_INT);
    $etatConservation = cleanInput($_POST['etat_conservation'] ?? 'bon etat');
    $nbExemplaires = filter_input(INPUT_POST, 'nb_exemplaires', FILTER_VALIDATE_INT);
    
    // Validation des données obligatoires
    if (empty($titre)) {
        echo json_encode(['success' => false, 'message' => 'Le titre est obligatoire']);
        exit;
    }
    
    if (empty($auteur)) {
        echo json_encode(['success' => false, 'message' => 'L\'auteur/artiste est obligatoire']);
        exit;
    }
    
    if (!$typeId) {
        echo json_encode(['success' => false, 'message' => 'Le type de média est obligatoire']);
        exit;
    }
    
    // Validation du nombre d'exemplaires
    if (!$nbExemplaires || $nbExemplaires < 1 || $nbExemplaires > 10) {
        $nbExemplaires = 1;
    }
    
    // Validation de l'état de conservation
    $etatsValides = ['neuf', 'bon etat', 'mauvais etat'];
    if (!in_array($etatConservation, $etatsValides)) {
        $etatConservation = 'bon etat';
    }
    
    // Vérifier que le type existe
    $stmt = $connexion->prepare("SELECT Nom FROM type WHERE id = :type_id");
    $stmt->bindParam(':type_id', $typeId, PDO::PARAM_INT);
    $stmt->execute();
    $typeNom = $stmt->fetch();
    
    if (!$typeNom) {
        echo json_encode(['success' => false, 'message' => 'Type de média invalide']);
        exit;
    }
    
    // Vérifier si le média existe déjà (même titre + auteur + type)
    $stmt = $connexion->prepare("
        SELECT id FROM media 
        WHERE LOWER(Titre) = LOWER(:titre) 
        AND LOWER(Auteur) = LOWER(:auteur) 
        AND type_id = :type_id
    ");
    $stmt->bindParam(':titre', $titre);
    $stmt->bindParam(':auteur', $auteur);
    $stmt->bindParam(':type_id', $typeId, PDO::PARAM_INT);
    $stmt->execute();
    $mediaExistant = $stmt->fetch();
    
    if ($mediaExistant) {
        echo json_encode(['success' => false, 'message' => 'Ce média existe déjà dans la base']);
        exit;
    }
    
    // Ajouter le média
    $mediaId = ajouterMedia(
        $titre,
        $auteur,
        $editeur,
        $dateParution,
        $genre,
        $typeId,
        $etatConservation,
        $nbExemplaires
    );
    
    if ($mediaId) {
        echo json_encode([
            'success' => true,
            'message' => "Média \"{$titre}\" ajouté avec succès ({$nbExemplaires} exemplaire(s))",
            'data' => [
                'media_id' => $mediaId,
                'titre' => $titre,
                'auteur' => $auteur,
                'type' => $typeNom['Nom'],
                'nb_exemplaires' => $nbExemplaires
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du média']);
    }
    
} catch (Exception $e) {
    error_log("Erreur ajout média AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>