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
    
    // Récupération des données
    $adherentId = filter_var($input['adherent_id'] ?? 0, FILTER_VALIDATE_INT);
    $nouveauStatut = cleanInput($input['nouveau_statut'] ?? '');
    
    if (!$adherentId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'adhérent invalide']);
        exit;
    }
    
    if (!in_array($nouveauStatut, ['actif', 'inactif'])) {
        echo json_encode(['success' => false, 'message' => 'Statut invalide']);
        exit;
    }
    
    // Vérifier que l'adhérent existe
    $adherent = getAdherentById($adherentId);
    if (!$adherent) {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable']);
        exit;
    }
    
    // Vérifier qu'on ne désactive pas un adhérent avec des emprunts actifs
    if ($nouveauStatut === 'inactif') {
        $stmt = $connexion->prepare("
            SELECT COUNT(*) as nb_emprunts_actifs 
            FROM emprunt 
            WHERE adherent_id = :adherent_id 
            AND Statut_Emprunt IN ('emprunté', 'en retard')
        ");
        $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
        $stmt->execute();
        $nbEmpruntsActifs = $stmt->fetch()['nb_emprunts_actifs'];
        
        if ($nbEmpruntsActifs > 0) {
            echo json_encode(['success' => false, 'message' => 'Impossible de désactiver un adhérent avec des emprunts en cours']);
            exit;
        }
    }
    
    // Modifier le statut
    $stmt = $connexion->prepare("UPDATE adherent SET Statut = :statut WHERE id = :adherent_id");
    $stmt->bindParam(':statut', $nouveauStatut);
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        $action = $nouveauStatut === 'actif' ? 'réactivé' : 'désactivé';
        
        echo json_encode([
            'success' => true,
            'message' => "Adhérent {$action} avec succès",
            'data' => [
                'adherent_id' => $adherentId,
                'nouveau_statut' => $nouveauStatut,
                'nom_complet' => $adherent['Prenom'] . ' ' . $adherent['Nom']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors du changement de statut']);
    }
    
} catch (Exception $e) {
    error_log("Erreur changement statut adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>