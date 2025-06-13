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
    // Récupération de l'ID de l'adhérent
    $adherentId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    
    if (!$adherentId) {
        echo json_encode(['success' => false, 'message' => 'ID d\'adhérent invalide']);
        exit;
    }
    
    // Vérifier que l'adhérent existe
    $adherent = getAdherentById($adherentId);
    
    if (!$adherent) {
        echo json_encode(['success' => false, 'message' => 'Adhérent introuvable']);
        exit;
    }
    
    // Statistiques rapides
    $stmt = $connexion->prepare("
        SELECT 
            COUNT(*) as total_emprunts,
            SUM(CASE WHEN Statut_Emprunt IN ('emprunté', 'en retard') THEN 1 ELSE 0 END) as emprunts_actifs,
            SUM(CASE WHEN Statut_Emprunt = 'en retard' THEN 1 ELSE 0 END) as emprunts_retard
        FROM emprunt 
        WHERE adherent_id = :adherent_id
    ");
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    $stmt->execute();
    $stats = $stmt->fetch();
    
    // Tous les emprunts avec détails
    $stmt = $connexion->prepare("
        SELECT e.*, m.Titre, m.Auteur, ex.numero_exemplaire,
               DATEDIFF(CURDATE(), e.Date_Retour_Prévue) as jours_retard
        FROM emprunt e
        JOIN media m ON e.media_id = m.id
        JOIN exemplaire ex ON e.exemplaire_id = ex.id
        WHERE e.adherent_id = :adherent_id
        ORDER BY 
            CASE e.Statut_Emprunt 
                WHEN 'en retard' THEN 1
                WHEN 'emprunté' THEN 2
                WHEN 'rendu' THEN 3
            END,
            e.Date_Emprunt DESC
    ");
    $stmt->bindParam(':adherent_id', $adherentId, PDO::PARAM_INT);
    $stmt->execute();
    $emprunts = $stmt->fetchAll();
    
    // Formater les emprunts
    $empruntsFormates = [];
    foreach ($emprunts as $emprunt) {
        $empruntsFormates[] = [
            'id' => $emprunt['ID_Emprunt'],
            'titre' => $emprunt['Titre'],
            'auteur' => $emprunt['Auteur'],
            'numero_exemplaire' => $emprunt['numero_exemplaire'],
            'date_emprunt' => format_date_fr($emprunt['Date_Emprunt']),
            'date_retour_prevue' => format_date_fr($emprunt['Date_Retour_Prévue']),
            'statut' => $emprunt['Statut_Emprunt'],
            'jours_retard' => max(0, $emprunt['jours_retard'])
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'adherent_id' => $adherentId,
            'adherent_nom' => $adherent['Prenom'] . ' ' . $adherent['Nom'],
            'emprunts_actifs' => (int)$stats['emprunts_actifs'],
            'emprunts_retard' => (int)$stats['emprunts_retard'],
            'total_emprunts' => (int)$stats['total_emprunts'],
            'emprunts' => $empruntsFormates
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération emprunts adhérent AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>