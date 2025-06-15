<?php
/**
 * Configuration de la base de données - Médiathèque Livresse
 * Gestion de la connexion MySQL et constantes du projet
 */

// Configuration de la base de données
$host = '192.168.135.113';
$dbname = 'gontaluc';  // Nom de ta base de données
$user = 'gontaluc';
$pass = 'As+CNNa9PgC8ck=';
$charset = 'utf8mb4';

// Options de connexion PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Créer la connexion PDO
    $connexion = new PDO("mysql:host=$host;dbname=$dbname;charset=$charset", $user, $pass, $options);
} catch (\PDOException $e) {
    // Gestion des erreurs de connexion
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}

// Démarrer la session
session_start();

// Constantes du projet
define('SITE_NAME', 'Médiathèque Livresse');
define('SITE_URL', 'http://localhost/mediatheque-livresse/');
define('ADMIN_URL', SITE_URL . 'admin/');

// Constantes pour les emprunts
define('DUREE_EMPRUNT_DEFAUT', 30); // 30 jours par défaut
define('DUREE_EMPRUNT_LIVRE', 21);  // 21 jours pour les livres
define('DUREE_EMPRUNT_CD', 14);     // 14 jours pour les CD/DVD
define('DUREE_EMPRUNT_VHS', 7);     // 7 jours pour les VHS

// Types de médias (correspondant à la table 'type')
define('TYPE_CASSETTE_AUDIO', 1);
define('TYPE_CD', 2);
define('TYPE_DVD', 3);
define('TYPE_LIVRE', 4);
define('TYPE_VHS', 5);
define('TYPE_VINYLE', 6);

// États de conservation
define('ETAT_NEUF', 'neuf');
define('ETAT_BON', 'bon etat');
define('ETAT_MAUVAIS', 'mauvais etat');

// Statuts d'emprunt
define('STATUT_RENDU', 'rendu');
define('STATUT_EN_RETARD', 'en retard');
define('STATUT_EMPRUNTE', 'emprunté');

// Statuts d'adhérent
define('STATUT_ADHERENT_ACTIF', 'actif');
define('STATUT_ADHERENT_INACTIF', 'inactif');

// Configuration de l'affichage des erreurs (à désactiver en production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Europe/Paris');

// === FONCTIONS UTILITAIRES ===

/**
 * Nettoie et valide une entrée utilisateur
 * @param string $data Donnée à nettoyer
 * @return string Donnée nettoyée
 */
function cleanInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Alias pour la compatibilité
function clean_input($data) {
    return cleanInput($data);
}

/**
 * Génère un message flash (notification)
 * @param string $message Le message à afficher
 * @param string $type Le type de message (success, danger, warning, info)
 */
function set_flash_message($message, $type = 'info') {
    if (!isset($_SESSION['flash_messages'])) {
        $_SESSION['flash_messages'] = [];
    }
    $_SESSION['flash_messages'][] = [
        'message' => $message,
        'type' => $type
    ];
}

/**
 * Affiche les messages flash et les efface
 */
function display_flash_messages() {
    if (isset($_SESSION['flash_messages'])) {
        foreach ($_SESSION['flash_messages'] as $flash) {
            $alertClass = '';
            
            // Conversion des types pour votre CSS admin
            switch($flash['type']) {
                case 'success':
                    $alertClass = 'alert-success';
                    break;
                case 'danger':
                case 'error':
                    $alertClass = 'alert-danger';
                    break;
                case 'warning':
                    $alertClass = 'alert-warning';
                    break;
                default:
                    $alertClass = 'alert-info';
            }
            
            echo "<div class='alert {$alertClass} alert-dismissible'>
                    <button type='button' class='alert-close'>&times;</button>
                    " . htmlspecialchars($flash['message']) . "
                  </div>";
        }
        // Efface les messages après les avoir affichés
        unset($_SESSION['flash_messages']);
    }
}

// Alias pour la compatibilité avec le footer
function display_flash_message() {
    display_flash_messages();
}

/**
 * Redirige l'utilisateur vers une page spécifique
 * @param string $page URL de redirection
 */
function redirect($page) {
    header("Location: $page");
    exit();
}

/**
 * Vérifie la validité d'une adresse email
 * @param string $email Adresse email à valider
 * @return bool
 */
function is_valid_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Génère un token CSRF
 * @return string
 */
function generate_csrf_token() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Vérifie un token CSRF
 * @param string $token Token à vérifier
 * @return bool
 */
function verify_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && 
           hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Formate une date française
 * @param string $date Date au format SQL
 * @return string Date formatée
 */
function format_date_fr($date) {
    if (empty($date) || $date === '0000-00-00') {
        return 'Non définie';
    }
    $timestamp = strtotime($date);
    return date('d/m/Y', $timestamp);
}

/**
 * Calcule les jours de retard pour un emprunt
 * @param string $date_retour_prevue Date de retour prévue
 * @return int Nombre de jours de retard
 */
function calculate_late_days($date_retour_prevue) {
    $date_retour = new DateTime($date_retour_prevue);
    $today = new DateTime();
    
    if ($today > $date_retour) {
        return $today->diff($date_retour)->days;
    }
    
    return 0;
}

/**
 * Récupère le statut d'un emprunt
 * @param string $date_retour_prevue Date de retour prévue
 * @return string Statut de l'emprunt
 */
function get_emprunt_status($date_retour_prevue) {
    $date_retour = new DateTime($date_retour_prevue);
    $today = new DateTime();
    
    if ($today > $date_retour) {
        return 'en retard';
    }
    
    return 'emprunté';
}

/**
 * Fonction pour obtenir la durée d'emprunt selon le type de média
 */
function getDureeEmprunt($typeId) {
    switch ($typeId) {
        case TYPE_LIVRE:
            return DUREE_EMPRUNT_LIVRE;
        case TYPE_CD:
        case TYPE_DVD:
            return DUREE_EMPRUNT_CD;
        case TYPE_VHS:
            return DUREE_EMPRUNT_VHS;
        default:
            return DUREE_EMPRUNT_DEFAUT;
    }
}

/**
 * Fonction pour obtenir le nom du type de média
 */
function getTypeMediaNom($typeId) {
    $types = [
        TYPE_CASSETTE_AUDIO => 'Cassette Audio',
        TYPE_CD => 'CD',
        TYPE_DVD => 'DVD', 
        TYPE_LIVRE => 'Livre',
        TYPE_VHS => 'VHS',
        TYPE_VINYLE => 'Vinyle'
    ];
    
    return $types[$typeId] ?? 'Inconnu';
}

?>