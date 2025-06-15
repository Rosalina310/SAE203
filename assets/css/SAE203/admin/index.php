<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Mise à jour automatique des statuts d'emprunts
mettreAJourStatutsEmprunts();

// Récupération des données pour le tableau de bord
$statistiques = getStatistiquesGenerales();
$empruntsRecents = getEmpruntsRecents(5);
$statistiquesTypes = getStatistiquesParType();

// Titre de la page
$pageTitle = "Tableau de bord";
$currentPage = "dashboard";
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2 class="logo">LIVRESSE ADMINISTRATEUR</h2>
            </div>
            
            <nav class="nav-menu">
                <a href="index.php" class="nav-link active">
                    <span class="nav-text">Tableau de bord</span>
                </a>
                <a href="emprunts.php" class="nav-link">
                    <span class="nav-text">Gestion des emprunts</span>
                </a>
                <a href="stock.php" class="nav-link">
                    <span class="nav-text">Gestion du stock</span>
                </a>
                <a href="statistiques.php" class="nav-link">
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
                    <button class="btn-logout" onclick="window.location.href='../index.php'">
                        Déconnexion
                    </button>
                </div>
            </header>

            <!-- Flash Messages -->
            <div class="flash-messages">
                <?php display_flash_messages(); ?>
            </div>

            <!-- Dashboard Content -->
            <div class="dashboard-content">
                <!-- Statistiques Cards -->
                <section class="dashboard-cards">
                    <div class="stat-card">
                        <div class="stat-content">
                            <h3 class="stat-title">TOTAL DES OBJETS</h3>
                            <div class="stat-number"><?php echo number_format($statistiques['total_objets']); ?></div>
                        </div>
                        <div class="stat-icon total-objects"></div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-content">
                            <h3 class="stat-title">EMPRUNT EN COURS</h3>
                            <div class="stat-number"><?php echo number_format($statistiques['emprunts_cours']); ?></div>
                        </div>
                        <div class="stat-icon active-loans"></div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-content">
                            <h3 class="stat-title">EMPRUNTS À RENDRE</h3>
                            <div class="stat-number"><?php echo number_format($statistiques['emprunts_retard']); ?></div>
                        </div>
                        <div class="stat-icon overdue-loans"></div>
                    </div>
                </section>

                <!-- Emprunts Récents -->
                <section class="recent-loans-section">
                    <div class="section-header">
                        <h2 class="section-title">EMPRUNTS RÉCENTS</h2>
                        <a href="emprunts.php" class="btn btn-secondary">Voir tous les emprunts</a>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>TITRE</th>
                                    <th>EMPRUNTEUR</th>
                                    <th>DATE D'EMPRUNT</th>
                                    <th>DATE RETOUR</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($empruntsRecents)): ?>
                                    <tr>
                                        <td colspan="5" class="empty-state">Aucun emprunt récent</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($empruntsRecents as $emprunt): ?>
                                        <tr class="loan-row <?php echo $emprunt['Statut_Emprunt'] === 'en retard' ? 'overdue' : ''; ?>">
                                            <td class="media-title"><?php echo htmlspecialchars($emprunt['Titre']); ?></td>
                                            <td class="borrower-name"><?php echo htmlspecialchars($emprunt['emprunteur']); ?></td>
                                            <td class="loan-date"><?php echo format_date_fr($emprunt['Date_Emprunt']); ?></td>
                                            <td class="return-date"><?php echo format_date_fr($emprunt['Date_Retour_Prévue']); ?></td>
                                            <td class="action-buttons">
                                                <button class="btn-action btn-extend" 
                                                        onclick="prolongerEmprunt(<?php echo $emprunt['ID_Emprunt']; ?>)"
                                                        title="Prolonger">
                                                    Prolonger
                                                </button>
                                                <button class="btn-action btn-remind" 
                                                        onclick="relancerAdherent(<?php echo $emprunt['ID_Emprunt']; ?>)"
                                                        title="Relancer">
                                                    Relancer
                                                </button>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Actions Rapides -->
                <section class="quick-actions-section">
                    <div class="section-header">
                        <h2 class="section-title">ACTIONS RAPIDES</h2>
                    </div>
                    
                    <div class="quick-actions-grid">
                        <button class="quick-action-card" onclick="window.location.href='emprunts.php'">
                            <div class="action-icon new-loan"></div>
                            <h3 class="action-title">Nouvel Emprunt</h3>
                            <p class="action-description">Enregistrer un nouveau prêt</p>
                        </button>

                        <button class="quick-action-card" onclick="window.location.href='ajouter_media.php'">
                            <div class="action-icon new-media"></div>
                            <h3 class="action-title">Ajouter un Média</h3>
                            <p class="action-description">Ajouter un livre, CD, DVD...</p>
                        </button>

                        <button class="quick-action-card" onclick="window.location.href='ajouter_adherent.php'">
                            <div class="action-icon new-member"></div>
                            <h3 class="action-title">Nouvel Adhérent</h3>
                            <p class="action-description">Inscrire un nouveau membre</p>
                        </button>

                        <button class="quick-action-card" onclick="window.location.href='statistiques.php'">
                            <div class="action-icon stats"></div>
                            <h3 class="action-title">Voir Statistiques</h3>
                            <p class="action-description">Analyses détaillées</p>
                        </button>
                    </div>
                </section>
            </div>
        </main>
    </div>

    <!-- Modal Nouvel Emprunt -->
    <div class="modal-overlay" id="modalNouvelEmprunt">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Nouveau Prêt</h3>
                <button class="modal-close" onclick="fermerModal('modalNouvelEmprunt')">&times;</button>
            </div>
            <div class="modal-body">
                <form class="form-container" id="formNouvelEmprunt">
                    <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                    
                    <div class="form-group">
                        <label for="media_id" class="form-label">Média</label>
                        <select name="media_id" id="media_id" class="form-select" required>
                            <option value="">Sélectionnez un média</option>
                            <?php 
                            $mediasDisponibles = getMediasDisponibles();
                            foreach ($mediasDisponibles as $media): 
                            ?>
                                <option value="<?php echo $media['id']; ?>">
                                    <?php echo htmlspecialchars($media['Titre'] . ' - ' . $media['Auteur']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="adherent_id" class="form-label">Emprunteur</label>
                        <select name="adherent_id" id="adherent_id" class="form-select" required>
                            <option value="">Sélectionnez un adhérent</option>
                            <?php 
                            $adherentsActifs = getAdherentsActifs();
                            foreach ($adherentsActifs as $adherent): 
                            ?>
                                <option value="<?php echo $adherent['id']; ?>">
                                    <?php echo htmlspecialchars($adherent['nom_complet']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="duree_jours" class="form-label">Durée (jours)</label>
                        <input type="number" name="duree_jours" id="duree_jours" 
                               class="form-input" value="21" min="1" max="90">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouvelEmprunt')">
                    Annuler
                </button>
                <button type="submit" form="formNouvelEmprunt" class="btn btn-primary">
                    Enregistrer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Nouveau Média -->
    <div class="modal-overlay" id="modalNouveauMedia">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Ajouter un Média</h3>
                <button class="modal-close" onclick="fermerModal('modalNouveauMedia')">&times;</button>
            </div>
            <div class="modal-body">
                <form class="form-container" id="formNouveauMedia">
                    <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="titre" class="form-label">Titre</label>
                            <input type="text" name="titre" id="titre" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="auteur" class="form-label">Auteur/Artiste</label>
                            <input type="text" name="auteur" id="auteur" class="form-input" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="type_id" class="form-label">Type</label>
                            <select name="type_id" id="type_id" class="form-select" required>
                                <option value="">Sélectionnez un type</option>
                                <?php 
                                $types = getTypesMedia();
                                foreach ($types as $type): 
                                ?>
                                    <option value="<?php echo $type['id']; ?>">
                                        <?php echo htmlspecialchars($type['Nom']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="etat_conservation" class="form-label">État</label>
                            <select name="etat_conservation" id="etat_conservation" class="form-select" required>
                                <option value="neuf">Neuf</option>
                                <option value="bon etat" selected>Bon état</option>
                                <option value="mauvais etat">Mauvais état</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="editeur" class="form-label">Éditeur</label>
                        <input type="text" name="editeur" id="editeur" class="form-input">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="date_parution" class="form-label">Date de parution</label>
                            <input type="text" name="date_parution" id="date_parution" 
                                   class="form-input" placeholder="YYYY">
                        </div>
                        <div class="form-group">
                            <label for="nb_exemplaires" class="form-label">Nombre d'exemplaires</label>
                            <input type="number" name="nb_exemplaires" id="nb_exemplaires" 
                                   class="form-input" value="1" min="1" max="10">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="genre" class="form-label">Genre</label>
                        <input type="text" name="genre" id="genre" class="form-input">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouveauMedia')">
                    Annuler
                </button>
                <button type="submit" form="formNouveauMedia" class="btn btn-primary">
                    Enregistrer
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Nouvel Adhérent -->
    <div class="modal-overlay" id="modalNouvelAdherent">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Ajouter un Adhérent</h3>
                <button class="modal-close" onclick="fermerModal('modalNouvelAdherent')">&times;</button>
            </div>
            <div class="modal-body">
                <form class="form-container" id="formNouvelAdherent">
                    <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nom" class="form-label">Nom</label>
                            <input type="text" name="nom" id="nom" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="prenom" class="form-label">Prénom</label>
                            <input type="text" name="prenom" id="prenom" class="form-input" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" name="email" id="email" class="form-input" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouvelAdherent')">
                    Annuler
                </button>
                <button type="submit" form="formNouvelAdherent" class="btn btn-primary">
                    Enregistrer
                </button>
            </div>
        </div>
    </div>

    <script src="../assets/js/admin.js"></script>
    <script src="../assets/js/components.js"></script>
</body>
</html>