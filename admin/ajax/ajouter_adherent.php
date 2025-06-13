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
    $nom = cleanInput($_POST['nom'] ?? '');
    $prenom = cleanInput($_POST['prenom'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    
    // Validation des données obligatoires
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
    
    // Vérifier que l'email n'existe pas déjà
    $stmt = $connexion->prepare("SELECT id FROM adherent WHERE LOWER(Email) = LOWER(:email)");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $emailExistant = $stmt->fetch();
    
    if ($emailExistant) {
        echo json_encode(['success' => false, 'message' => 'Cette adresse email est déjà utilisée']);
        exit;
    }
    
    // Vérifier s'il n'y a pas déjà un adhérent avec le même nom/prénom
    $stmt = $connexion->prepare("
        SELECT id FROM adherent 
        WHERE LOWER(Nom) = LOWER(:nom) 
        AND LOWER(Prenom) = LOWER(:prenom)
    ");
    $stmt->bindParam(':nom', $nom);
    $stmt->bindParam(':prenom', $prenom);
    $stmt->execute();
    $adherentExistant = $stmt->fetch();
    
    if ($adherentExistant) {
        echo json_encode(['success' => false, 'message' => 'Un adhérent avec ce nom et prénom existe déjà']);
        exit;
    }
    
    // Ajouter l'adhérent
    $resultat = ajouterAdherent($nom, $prenom, $email);
    
    if ($resultat) {
        // Récupérer l'ID de l'adhérent créé
        $stmt = $connexion->prepare("
            SELECT id FROM adherent 
            WHERE Nom = :nom AND Prenom = :prenom AND Email = :email
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->bindParam(':nom', $nom);
        $stmt->bindParam(':prenom', $prenom);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $adherentId = $stmt->fetch()['id'];
        
        echo json_encode([
            'success' => true,
            'message' => "Adhérent {$prenom} {$nom} ajouté avec succès",
            'data' => [
                'adherent_id' => $adherentId,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'nom_complet' => "{$prenom} {$nom}"
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de l\'adhérent']);
    }
    
} catch (Exception $e) {
    error_log("Erreur ajout adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>