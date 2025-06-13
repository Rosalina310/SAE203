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
    
    // Récupérer les emprunts récents
    $empruntsRecents = getEmpruntsRecents(5);
    
    // Générer le HTML pour le tableau
    $html = '';
    
    if (empty($empruntsRecents)) {
        $html = '<tr><td colspan="5" class="empty-state">Aucun emprunt récent</td></tr>';
    } else {
        foreach ($empruntsRecents as $emprunt) {
            $classeRetard = $emprunt['Statut_Emprunt'] === 'en retard' ? 'overdue' : '';
            
            $html .= '<tr class="loan-row ' . $classeRetard . '">';
            $html .= '<td class="media-title">' . htmlspecialchars($emprunt['Titre']) . '</td>';
            $html .= '<td class="borrower-name">' . htmlspecialchars($emprunt['emprunteur']) . '</td>';
            $html .= '<td class="loan-date">' . format_date_fr($emprunt['Date_Emprunt']) . '</td>';
            $html .= '<td class="return-date">' . format_date_fr($emprunt['Date_Retour_Prévue']) . '</td>';
            $html .= '<td class="action-buttons">';
            $html .= '<button class="btn-action btn-extend" onclick="prolongerEmprunt(' . $emprunt['ID_Emprunt'] . ')" title="Prolonger">Prolonger</button>';
            $html .= '<button class="btn-action btn-remind" onclick="relancerAdherent(' . $emprunt['ID_Emprunt'] . ')" title="Relancer">Relancer</button>';
            $html .= '</td>';
            $html .= '</tr>';
        }
    }
    
    echo json_encode([
        'success' => true,
        'html' => $html,
        'count' => count($empruntsRecents)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur récupération emprunts récents AJAX : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>