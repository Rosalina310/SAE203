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
    
    // Récupération et validation des données
    $mediaId = filter_input(INPUT_POST, 'media_id', FILTER_VALIDATE_INT);
    $adherentId = filter_input(INPUT_POST, 'adherent_id', FILTER_VALIDATE_INT);
    $dureeJours = filter_input(INPUT_POST, 'duree_jours', FILTER_VALIDATE_INT);
    
    // Validation des données obligatoires
    if (!$mediaId || !$adherentId) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes ou invalides']);
        exit;
    }
    
    // Validation de la durée (entre 1 et 90 jours)
    if (!$dureeJours || $dureeJours < 1 || $dureeJours > 90) {
        $dureeJours = 21; // Valeur par défaut
    }
    
    // Vérifier que l'adhérent existe et est actif
    $adherent = getAdherentById($adherentId);
    if (!$adherent || $adherent['Statut'] !== 'actif') {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable ou inactif']);
        exit;
    }
    
    // Vérifier qu'il y a des exemplaires disponibles
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as disponibles 
        FROM exemplaire 
        WHERE media_id = :media_id AND disponible = 1
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->execute();
    $disponibles = $stmt->fetch()['disponibles'];
    
    if ($disponibles == 0) {
        echo json_encode(['success' => false, 'message' => 'Aucun exemplaire disponible pour ce média']);
        exit;
    }
    
    // Vérifier que l'adhérent n'a pas déjà emprunté ce média
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as nb_emprunts 
        FROM emprunt 
        WHERE media_id = :media_id 
        AND adherent_id = :adherent_id 
        AND Statut_Emprunt IN ('emprunté', 'en retard')
    ");
    $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    $stmt->execute();
    $nbEmprunts = $stmt->fetch()['nb_emprunts'];
    
    if ($nbEmprunts > 0) {
        echo json_encode(['success' => false, 'message' => 'Cet adhérent a déjà emprunté ce média']);
        exit;
    }
    
    // Créer l'emprunt
    $resultat = creerEmprunt($mediaId, $adherentId, $dureeJours);
    
    if ($resultat) {
        // Récupérer les informations pour la réponse
        $stmt = $connexion->prepare("
            SELECT m.Titre, CONCAT(a.Prenom, ' ', a.Nom) as emprunteur
            FROM media m, adherent a
            WHERE m.id = :media_id AND a.id = :adherent_id
        ");
        $stmt->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
        $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
        $stmt->execute();
        $info = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'message' => "Emprunt créé avec succès pour \"{$info['Titre']}\" par {$info['emprunteur']}",
            'data' => [
                'media_titre' => $info['Titre'],
                'emprunteur' => $info['emprunteur'],
                'duree' => $dureeJours
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de l\'emprunt']);
    }
    
} catch (Exception $e) {
    error_log("Erreur création emprunt AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>