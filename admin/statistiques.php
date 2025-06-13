<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Mise à jour automatique des statuts d'emprunts
mettreAJourStatutsEmprunts();

// Période de filtrage (par défaut : 12 derniers mois)
$periode = $_GET['periode'] ?? '12mois';
$dateDebut = '';
$dateFin = date('Y-m-d');

switch ($periode) {
    case '1mois':
        $dateDebut = date('Y-m-d', strtotime('-1 month'));
        break;
    case '3mois':
        $dateDebut = date('Y-m-d', strtotime('-3 months'));
        break;
    case '6mois':
        $dateDebut = date('Y-m-d', strtotime('-6 months'));
        break;
    case '12mois':
        $dateDebut = date('Y-m-d', strtotime('-12 months'));
        break;
    case 'annee':
        $dateDebut = date('Y-01-01');
        break;
    case 'tout':
        $dateDebut = '2000-01-01';
        break;
}

// Statistiques générales
$stats = getStatistiquesGenerales();

// Statistiques par type de média
$statsTypes = getStatistiquesParType();

// Statistiques des emprunts par mois (12 derniers mois)
$stmt = $connexion->prepare("
    SELECT 
        DATE_FORMAT(Date_Emprunt, '%Y-%m') as mois,
        COUNT(*) as nb_emprunts
    FROM emprunt 
    WHERE Date_Emprunt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(Date_Emprunt, '%Y-%m')
    ORDER BY mois
");
$stmt->execute();
$empruntsParMois = $stmt->fetchAll();

// Top 10 des médias les plus empruntés
$stmt = $connexion->prepare("
    SELECT m.Titre, m.Auteur, t.Nom as type_nom, COUNT(e.ID_Emprunt) as nb_emprunts
    FROM media m
    JOIN type t ON m.type_id = t.id
    LEFT JOIN emprunt e ON m.id = e.media_id
    WHERE e.Date_Emprunt >= :date_debut
    GROUP BY m.id
    ORDER BY nb_emprunts DESC
    LIMIT 10
");
$stmt->bindParam(':date_debut', $dateDebut);
$stmt->execute();
$topMedias = $stmt->fetchAll();

// Top 10 des adhérents les plus actifs
$stmt = $connexion->prepare("
    SELECT 
        CONCAT(a.Prenom, ' ', a.Nom) as nom_complet,
        a.Email,
        COUNT(e.ID_Emprunt) as nb_emprunts,
        MAX(e.Date_Emprunt) as dernier_emprunt
    FROM adherent a
    LEFT JOIN emprunt e ON a.id = e.adherent_id
    WHERE e.Date_Emprunt >= :date_debut
    GROUP BY a.id
    ORDER BY nb_emprunts DESC
    LIMIT 10
");
$stmt->bindParam(':date_debut', $dateDebut);
$stmt->execute();
$topAdherents = $stmt->fetchAll();

// Statistiques de retards - REQUÊTE CORRIGÉE
$stmt = $connexion->query("
    SELECT 
        COUNT(CASE WHEN Statut_Emprunt = 'en retard' THEN 1 END) as retards_actuels,
        COUNT(CASE WHEN Date_Retour_Prévue < CURDATE() AND Statut_Emprunt = 'rendu' THEN 1 END) as retards_historiques,
        AVG(CASE 
            WHEN Statut_Emprunt = 'rendu' AND Date_Retour_Prévue < CURDATE() 
            THEN DATEDIFF(CURDATE(), Date_Retour_Prévue)
            WHEN Statut_Emprunt = 'en retard' 
            THEN DATEDIFF(CURDATE(), Date_Retour_Prévue)
            ELSE NULL 
        END) as duree_moyenne_retard
    FROM emprunt
    WHERE Date_Retour_Prévue < CURDATE() OR Statut_Emprunt = 'en retard'
");
$statsRetards = $stmt->fetch();

// Taux d'occupation par type
$stmt = $connexion->query("
    SELECT 
        t.Nom as type_nom,
        COUNT(ex.id) as total_exemplaires,
        SUM(CASE WHEN ex.disponible = 0 THEN 1 ELSE 0 END) as exemplaires_empruntes,
        ROUND((SUM(CASE WHEN ex.disponible = 0 THEN 1 ELSE 0 END) / COUNT(ex.id)) * 100, 1) as taux_occupation
    FROM type t
    LEFT JOIN media m ON t.id = m.type_id
    LEFT JOIN exemplaire ex ON m.id = ex.media_id
    GROUP BY t.id, t.Nom
    HAVING total_exemplaires > 0
    ORDER BY taux_occupation DESC
");
$tauxOccupation = $stmt->fetchAll();

$pageTitle = "Statistiques et analyses";
$currentPage = "statistiques";
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/admin.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2 class="logo">LIVRESSE ADMINISTRATEUR</h2>
            </div>
            
            <nav class="nav-menu">
                <a href="index.php" class="nav-link">
                    <span class="nav-text">Tableau de bord</span>
                </a>
                <a href="emprunts.php" class="nav-link">
                    <span class="nav-text">Gestion des emprunts</span>
                </a>
                <a href="stock.php" class="nav-link">
                    <span class="nav-text">Gestion du stock</span>
                </a>
                <a href="statistiques.php" class="nav-link active">
                    <span class="nav-text">Statistiques</span>
                </a>
                <a href="adherents.php" class="nav-link">
                    <span class="nav-text">Adhérents</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="content-header">
                <div class="header-left">
                    <button class="menu-toggle" id="menuToggle">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                    <h1 class="page-title"><?php echo $pageTitle; ?></h1>
                </div>
                <div class="header-right">
                    <select id="periodFilter" class="period-filter" onchange="changerPeriode()">
                        <option value="1mois" <?php echo $periode === '1mois' ? 'selected' : ''; ?>>Dernier mois</option>
                        <option value="3mois" <?php echo $periode === '3mois' ? 'selected' : ''; ?>>3 derniers mois</option>
                        <option value="6mois" <?php echo $periode === '6mois' ? 'selected' : ''; ?>>6 derniers mois</option>
                        <option value="12mois" <?php echo $periode === '12mois' ? 'selected' : ''; ?>>12 derniers mois</option>
                        <option value="annee" <?php echo $periode === 'annee' ? 'selected' : ''; ?>>Cette année</option>
                        <option value="tout" <?php echo $periode === 'tout' ? 'selected' : ''; ?>>Toutes les données</option>
                    </select>
                    <button class="btn-logout" onclick="window.location.href='../index.php'">
                        Déconnexion
                    </button>
                </div>
            </header>

            <!-- Flash Messages -->
            <div class="flash-messages">
                <?php display_flash_messages(); ?>
            </div>

            <!-- Contenu Statistiques -->
            <div class="page-content">
                <!-- Métriques principales -->
                <section class="main-metrics">
                    <div class="metrics-grid">
                        <div class="metric-card primary">
                            <div class="metric-icon total-emprunts-icon"></div>
                            <div class="metric-content">
                                <div class="metric-number"><?php echo number_format($stats['emprunts_cours'] + count($empruntsParMois)); ?></div>
                                <div class="metric-label">Emprunts totaux</div>
                                <div class="metric-change">+12% ce mois</div>
                            </div>
                        </div>
                        
                        <div class="metric-card success">
                            <div class="metric-icon disponibles-icon"></div>
                            <div class="metric-content">
                                <div class="metric-number"><?php echo number_format($stats['total_objets'] - $stats['emprunts_cours']); ?></div>
                                <div class="metric-label">Médias disponibles</div>
                                <div class="metric-change">
                                    <?php echo $stats['total_objets'] > 0 ? round((($stats['total_objets'] - $stats['emprunts_cours']) / $stats['total_objets']) * 100, 1) : 0; ?>% du stock
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card warning">
                            <div class="metric-icon retards-icon"></div>
                            <div class="metric-content">
                                <div class="metric-number"><?php echo number_format($stats['emprunts_retard']); ?></div>
                                <div class="metric-label">Emprunts en retard</div>
                                <div class="metric-change">
                                    <?php echo $stats['emprunts_cours'] > 0 ? round(($stats['emprunts_retard'] / $stats['emprunts_cours']) * 100, 1) : 0; ?>% des emprunts
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card info">
                            <div class="metric-icon rotation-icon"></div>
                            <div class="metric-content">
                                <div class="metric-number">
                                    <?php echo $stats['total_objets'] > 0 ? round(($stats['emprunts_cours'] / $stats['total_objets']) * 100, 1) : 0; ?>%
                                </div>
                                <div class="metric-label">Taux d'occupation</div>
                                <div class="metric-change">
                                    <?php echo $stats['emprunts_cours']; ?> / <?php echo $stats['total_objets']; ?> exemplaires
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Graphiques principaux -->
                <section class="charts-section">
                    <div class="charts-grid">
                        <!-- Graphique des emprunts par mois -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Évolution des emprunts</h3>
                                <span class="chart-subtitle">12 derniers mois</span>
                            </div>
                            <div class="chart-container">
                                <canvas id="empruntsChart"></canvas>
                            </div>
                        </div>

                        <!-- Répartition par type de média -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Répartition du stock</h3>
                                <span class="chart-subtitle">Par type de média</span>
                            </div>
                            <div class="chart-container">
                                <canvas id="typesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Taux d'occupation -->
                <section class="occupation-section">
                    <div class="section-header">
                        <h2 class="section-title">Taux d'occupation par type</h2>
                    </div>
                    <div class="occupation-grid">
                        <?php foreach ($tauxOccupation as $occupation): ?>
                            <div class="occupation-card">
                                <div class="occupation-header">
                                    <h4 class="occupation-type"><?php echo htmlspecialchars($occupation['type_nom']); ?></h4>
                                    <span class="occupation-percentage"><?php echo $occupation['taux_occupation']; ?>%</span>
                                </div>
                                <div class="occupation-bar">
                                    <div class="occupation-fill" style="width: <?php echo $occupation['taux_occupation']; ?>%"></div>
                                </div>
                                <div class="occupation-details">
                                    <span><?php echo $occupation['exemplaires_empruntes']; ?> / <?php echo $occupation['total_exemplaires']; ?> exemplaires</span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- Top listes -->
                <section class="top-lists-section">
                    <div class="top-lists-grid">
                        <!-- Top médias -->
                        <div class="top-list-card">
                            <div class="list-header">
                                <h3 class="list-title">📚 Médias les plus populaires</h3>
                                <span class="list-subtitle"><?php echo ucfirst($periode); ?></span>
                            </div>
                            <div class="top-list">
                                <?php foreach ($topMedias as $index => $media): ?>
                                    <div class="top-item">
                                        <div class="item-rank"><?php echo $index + 1; ?></div>
                                        <div class="item-content">
                                            <div class="item-title"><?php echo htmlspecialchars($media['Titre']); ?></div>
                                            <div class="item-subtitle"><?php echo htmlspecialchars($media['Auteur']); ?> · <?php echo htmlspecialchars($media['type_nom']); ?></div>
                                        </div>
                                        <div class="item-value"><?php echo $media['nb_emprunts']; ?> emprunts</div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($topMedias)): ?>
                                    <div class="empty-list">Aucune donnée pour cette période</div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Top adhérents -->
                        <div class="top-list-card">
                            <div class="list-header">
                                <h3 class="list-title">👥 Adhérents les plus actifs</h3>
                                <span class="list-subtitle"><?php echo ucfirst($periode); ?></span>
                            </div>
                            <div class="top-list">
                                <?php foreach ($topAdherents as $index => $adherent): ?>
                                    <div class="top-item">
                                        <div class="item-rank"><?php echo $index + 1; ?></div>
                                        <div class="item-content">
                                            <div class="item-title"><?php echo htmlspecialchars($adherent['nom_complet']); ?></div>
                                            <div class="item-subtitle">
                                                Dernier emprunt : <?php echo format_date_fr($adherent['dernier_emprunt']); ?>
                                            </div>
                                        </div>
                                        <div class="item-value"><?php echo $adherent['nb_emprunts']; ?> emprunts</div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($topAdherents)): ?>
                                    <div class="empty-list">Aucune donnée pour cette période</div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Analyses détaillées -->
                <section class="detailed-analysis-section">
                    <div class="analysis-grid">
                        <!-- Analyse des retards -->
                        <div class="analysis-card">
                            <div class="analysis-header">
                                <h3 class="analysis-title">📊 Analyse des retards</h3>
                            </div>
                            <div class="analysis-content">
                                <div class="analysis-metrics">
                                    <div class="analysis-metric">
                                        <span class="metric-label">Retards actuels</span>
                                        <span class="metric-value danger"><?php echo $statsRetards['retards_actuels'] ?? 0; ?></span>
                                    </div>
                                    <div class="analysis-metric">
                                        <span class="metric-label">Retards historiques</span>
                                        <span class="metric-value"><?php echo $statsRetards['retards_historiques'] ?? 0; ?></span>
                                    </div>
                                    <div class="analysis-metric">
                                        <span class="metric-label">Durée moyenne de retard</span>
                                        <span class="metric-value warning">
                                            <?php echo round($statsRetards['duree_moyenne_retard'] ?? 0, 1); ?> jours
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Prévisions -->
                        <div class="analysis-card">
                            <div class="analysis-header">
                                <h3 class="analysis-title">🔮 Prévisions</h3>
                            </div>
                            <div class="analysis-content">
                                <div class="prediction-item">
                                    <span class="prediction-label">Retours prévus cette semaine</span>
                                    <?php
                                    $stmt = $connexion->query("
                                        SELECT COUNT(*) as nb_retours
                                        FROM emprunt 
                                        WHERE Date_Retour_Prévue BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                                        AND Statut_Emprunt IN ('emprunté', 'en retard')
                                    ");
                                    $retoursPreusSemaine = $stmt->fetch()['nb_retours'];
                                    ?>
                                    <span class="prediction-value"><?php echo $retoursPreusSemaine; ?></span>
                                </div>
                                
                                <div class="prediction-item">
                                    <span class="prediction-label">Nouveaux retards probables</span>
                                    <?php
                                    $stmt = $connexion->query("
                                        SELECT COUNT(*) as nb_futurs_retards
                                        FROM emprunt 
                                        WHERE Date_Retour_Prévue < DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                                        AND Statut_Emprunt = 'emprunté'
                                    ");
                                    $futursRetards = $stmt->fetch()['nb_futurs_retards'];
                                    ?>
                                    <span class="prediction-value warning"><?php echo $futursRetards; ?></span>
                                </div>
                                
                                <div class="prediction-item">
                                    <span class="prediction-label">Capacité disponible</span>
                                    <?php
                                    $capaciteDisponible = $stats['total_objets'] - $stats['emprunts_cours'];
                                    $pourcentageCapacite = $stats['total_objets'] > 0 ? round(($capaciteDisponible / $stats['total_objets']) * 100, 1) : 0;
                                    ?>
                                    <span class="prediction-value success"><?php echo $pourcentageCapacite; ?>%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>

    <script>
        // Données pour les graphiques
        const empruntsData = <?php echo json_encode($empruntsParMois); ?>;
        const typesData = <?php echo json_encode($statsTypes); ?>;
    </script>
    <script src="../assets/js/admin.js"></script>
</body>
</html>