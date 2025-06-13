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
    // Mise à jour des statuts avant récupération
    mettreAJourStatutsEmprunts();
    
    // Récupérer les statistiques générales
    $statistiques = getStatistiquesGenerales();
    
    if ($statistiques === false) {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des statistiques']);
        exit;
    }
    
    // Statistiques additionnelles
    try {
        // Nombre total d'adhérents actifs
        $stmt = $connexion->query("SELECT COUNT(*) as nb_adherents_actifs FROM adherent WHERE Statut = 'actif'");
        $nbAdherentsActifs = $stmt->fetch()['nb_adherents_actifs'];
        
        // Nombre de médias différents
        $stmt = $connexion->query("SELECT COUNT(*) as nb_medias FROM media");
        $nbMedias = $stmt->fetch()['nb_medias'];
        
        // Emprunts du mois en cours
        $stmt = $connexion->query("
            SELECT COUNT(*) as emprunts_mois 
            FROM emprunt 
            WHERE MONTH(Date_Emprunt) = MONTH(CURDATE()) 
            AND YEAR(Date_Emprunt) = YEAR(CURDATE())
        ");
        $empruntsMois = $stmt->fetch()['emprunts_mois'];
        
        // Taux d'emprunt (emprunts en cours / total exemplaires)
        $totalExemplaires = $statistiques['total_objets'];
        $empruntsEnCours = $statistiques['emprunts_cours'];
        $tauxEmprunt = $totalExemplaires > 0 ? round(($empruntsEnCours / $totalExemplaires) * 100, 1) : 0;
        
    } catch (PDOException $e) {
        // En cas d'erreur sur les stats additionnelles, on met des valeurs par défaut
        $nbAdherentsActifs = 0;
        $nbMedias = 0;
        $empruntsMois = 0;
        $tauxEmprunt = 0;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_objets' => (int)$statistiques['total_objets'],
            'emprunts_cours' => (int)$statistiques['emprunts_cours'],
            'emprunts_retard' => (int)$statistiques['emprunts_retard'],
            'nb_adherents_actifs' => (int)$nbAdherentsActifs,
            'nb_medias' => (int)$nbMedias,
            'emprunts_mois' => (int)$empruntsMois,
            'taux_emprunt' => $tauxEmprunt,
            'derniere_maj' => date('d/m/Y H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération statistiques AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>