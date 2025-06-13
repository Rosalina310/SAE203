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
    $joursSupplementaires = filter_var($input['jours'] ?? 14, FILTER_VALIDATE_INT);
    
    if (!$empruntId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'emprunt invalide']);
        exit;
    }
    
    // Validation des jours supplémentaires (entre 1 et 30)
    if (!$joursSupplementaires || $joursSupplementaires < 1 || $joursSupplementaires > 30) {
        $joursSupplementaires = 14; // Valeur par défaut
    }
    
    // Vérifier que l'emprunt existe et peut être prolongé
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
    
    // Vérifier que l'adhérent est toujours actif
    $stmt = $connexion->prepare("SELECT Statut FROM adherent WHERE id = :adherent_id");
    $stmt->bindParam(':adherent_id', $emprunt['adherent_id'], PDO::PARAM_INT);
    $stmt->execute();
    $statutAdherent = $stmt->fetch()['Statut'];
    
    if ($statutAdherent !== 'actif') {
        echo json_encode(['success' => false, 'message' => 'Impossible de prolonger : adhérent inactif']);
        exit;
    }
    
    // Vérifier qu'il n'y a pas trop de prolongations (max 2)
    $stmt = $connexion->prepare("
        SELECT COUNT(*) as nb_prolongations
        FROM emprunt 
        WHERE media_id = :media_id 
        AND adherent_id = :adherent_id 
        AND Date_Emprunt >= DATE_SUB(:date_emprunt, INTERVAL 90 DAY)
    ");
    $stmt->bindParam(':media_id', $emprunt['media_id'], PDO::PARAM_INT);
    $stmt->bindParam(':adherent_id', $emprunt['adherent_id'], PDO::PARAM_INT);
    $stmt->bindParam(':date_emprunt', $emprunt['Date_Emprunt']);
    $stmt->execute();
    $nbProlongations = $stmt->fetch()['nb_prolongations'];
    
    if ($nbProlongations >= 3) {
        echo json_encode(['success' => false, 'message' => 'Nombre maximum de prolongations atteint']);
        exit;
    }
    
    // Prolonger l'emprunt
    $resultat = prolongerEmprunt($empruntId, $joursSupplementaires);
    
    if ($resultat) {
        // Calculer la nouvelle date de retour
        $nouvelleDateRetour = date('Y-m-d', strtotime($emprunt['Date_Retour_Prévue'] . " +{$joursSupplementaires} days"));
        
        echo json_encode([
            'success' => true,
            'message' => "Emprunt prolongé de {$joursSupplementaires} jours",
            'data' => [
                'emprunt_id' => $empruntId,
                'titre' => $emprunt['Titre'],
                'emprunteur' => $emprunt['emprunteur'],
                'ancienne_date_retour' => format_date_fr($emprunt['Date_Retour_Prévue']),
                'nouvelle_date_retour' => format_date_fr($nouvelleDateRetour),
                'jours_supplementaires' => $joursSupplementaires
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la prolongation']);
    }
    
} catch (Exception $e) {
    error_log("Erreur prolongation emprunt AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>