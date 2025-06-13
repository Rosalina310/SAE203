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
    
    if (!$empruntId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'emprunt invalide']);
        exit;
    }
    
    // Récupérer les informations de l'emprunt et de l'adhérent
    $stmt = $connexion->prepare("
        SELECT e.*, m.Titre, m.Auteur,
               a.Nom, a.Prenom, a.Email,
               DATEDIFF(CURDATE(), e.Date_Retour_Prévue) as jours_retard
        FROM emprunt e
        JOIN media m ON e.media_id = m.id
        JOIN adherent a ON e.adherent_id = a.id
        WHERE e.ID_Emprunt = :emprunt_id
        AND e.Statut_Emprunt IN ('emprunté', 'en retard')
        AND a.Statut = 'actif'
    ");
    $stmt->bindParam(':emprunt_id', $empruntId, PDO::PARAM_INT);
    $stmt->execute();
    $emprunt = $stmt->fetch();
    
    if (!$emprunt) {
        echo json_encode(['success' => false, 'message' => 'Emprunt introuvable ou adhérent inactif']);
        exit;
    }
    
    // Vérifier que l'email est valide
    if (empty($emprunt['Email']) || !is_valid_email($emprunt['Email'])) {
        echo json_encode(['success' => false, 'message' => 'Adresse email invalide pour cet adhérent']);
        exit;
    }
    
    // Préparer le message de relance
    $nomComplet = $emprunt['Prenom'] . ' ' . $emprunt['Nom'];
    $titreMedia = $emprunt['Titre'];
    $auteurMedia = $emprunt['Auteur'];
    $dateRetour = format_date_fr($emprunt['Date_Retour_Prévue']);
    $joursRetard = max(0, $emprunt['jours_retard']);
    
    $sujet = "Rappel - Retour de média - Médiathèque Livresse";
    
    if ($joursRetard > 0) {
        $typeMessage = "en retard";
        $message = "
Bonjour {$nomComplet},

Nous vous informons que le média suivant est en retard de {$joursRetard} jour(s) :

📚 Titre : {$titreMedia}
👤 Auteur : {$auteurMedia}
📅 Date de retour prévue : {$dateRetour}

Merci de bien vouloir rapporter ce média dès que possible à la médiathèque.

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Médiathèque Livresse
        ";
    } else {
        $typeMessage = "de rappel";
        $message = "
Bonjour {$nomComplet},

Nous vous rappelons que vous avez emprunté le média suivant :

📚 Titre : {$titreMedia}
👤 Auteur : {$auteurMedia}
📅 Date de retour prévue : {$dateRetour}

Merci de penser à le rapporter avant la date d'échéance.

Cordialement,
L'équipe de la Médiathèque Livresse
        ";
    }
    
    // Ici, tu peux implémenter l'envoi d'email réel avec mail() ou PHPMailer
    // Pour l'instant, on simule l'envoi avec un log
    
    $emailEnvoye = true; // Simulation - remplace par ton système d'email
    
    if ($emailEnvoye) {
        // Enregistrer la relance dans un log ou une table (optionnel)
        try {
            $stmt = $connexion->prepare("
                INSERT INTO log_relances (emprunt_id, adherent_id, type_relance, email_envoye, date_relance)
                VALUES (:emprunt_id, :adherent_id, :type_relance, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                date_relance = NOW(), 
                nb_relances = nb_relances + 1
            ");
            $stmt->bindParam(':emprunt_id', $empruntId, PDO::PARAM_INT);
            $stmt->bindParam(':adherent_id', $emprunt['adherent_id'], PDO::PARAM_INT);
            $stmt->bindParam(':type_relance', $typeMessage);
            $stmt->execute();
        } catch (PDOException $e) {
            // Si la table log_relances n'existe pas, on ignore l'erreur
            error_log("Log relance impossible : " . $e->getMessage());
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Relance {$typeMessage} envoyée à {$nomComplet}",
            'data' => [
                'emprunt_id' => $empruntId,
                'adherent_nom' => $nomComplet,
                'adherent_email' => $emprunt['Email'],
                'titre_media' => $titreMedia,
                'jours_retard' => $joursRetard,
                'type_relance' => $typeMessage
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email']);
    }
    
} catch (Exception $e) {
    error_log("Erreur relance adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}

/* 
EXEMPLE D'IMPLÉMENTATION AVEC PHPMAILER (à décommenter si tu veux utiliser) :

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

function envoyerEmailRelance($email, $sujet, $message) {
    $mail = new PHPMailer(true);
    
    try {
        // Configuration SMTP
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com'; // Remplace par ton serveur SMTP
        $mail->SMTPAuth   = true;
        $mail->Username   = 'ton-email@gmail.com'; // Ton email
        $mail->Password   = 'ton-mot-de-passe';    // Ton mot de passe
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        // Destinataires
        $mail->setFrom('mediatheque@livresse.fr', 'Médiathèque Livresse');
        $mail->addAddress($email);
        
        // Contenu
        $mail->isHTML(false);
        $mail->Subject = $sujet;
        $mail->Body    = $message;
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erreur envoi email : " . $mail->ErrorInfo);
        return false;
    }
}
*/
?>