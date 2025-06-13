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
    $adherentId = filter_input(INPUT_POST, 'adherent_id', FILTER_VALIDATE_INT);
    $nom = cleanInput($_POST['nom'] ?? '');
    $prenom = cleanInput($_POST['prenom'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    $statut = cleanInput($_POST['statut'] ?? 'actif');
    
    // Validation des données obligatoires
    if (!$adherentId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'adhérent invalide']);
        exit;
    }
    
    if (empty($nom)) {
        echo json_encode(['success' => false, 'message' => 'Le nom est obligatoire']);
        exit;
    }
    
    if (empty($prenom)) {
        echo json_encode(['success' => false, 'message' => 'Le prénom est obligatoire']);
        exit;
    }
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'L\'email est obligatoire']);
        exit;
    }
    
    // Validation de l'email
    if (!is_valid_email($email)) {
        echo json_encode(['success' => false, 'message' => 'Format d\'email invalide']);
        exit;
    }
    
    // Validation du statut
    if (!in_array($statut, ['actif', 'inactif'])) {
        $statut = 'actif';
    }
    
    // Vérifier que l'adhérent existe
    $adherentExistant = getAdherentById($adherentId);
    if (!$adherentExistant) {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable']);
        exit;
    }
    
    // Vérifier que l'email n'est pas déjà utilisé par un autre adhérent
    $stmt = $connexion->prepare("
        SELECT id FROM adherent 
        WHERE LOWER(Email) = LOWER(:email) 
        AND id != :adherent_id
    ");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    $stmt->execute();
    $emailExistant = $stmt->fetch();
    
    if ($emailExistant) {
        echo json_encode(['success' => false, 'message' => 'Cette adresse email est déjà utilisée par un autre adhérent']);
        exit;
    }
    
    // Vérifier qu'on ne désactive pas un adhérent avec des emprunts actifs
    if ($statut === 'inactif') {
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
    
    // Modifier l'adhérent
    $resultat = modifierAdherent($adherentId, $nom, $prenom, $email, $statut);
    
    if ($resultat) {
        echo json_encode([
            'success' => true,
            'message' => "Adhérent {$prenom} {$nom} modifié avec succès",
            'data' => [
                'adherent_id' => $adherentId,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'statut' => $statut
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification de l\'adhérent']);
    }
    
} catch (Exception $e) {
    error_log("Erreur modification adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>