<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/functions.php';

if (!isset($_GET['id'])) {
    header('Location: catalogue.php');
    exit();
}

$media_id = (int)$_GET['id'];

// Récupérer les détails du média
$media = $connexion->prepare("
    SELECT m.*, t.Nom as Type,
    (SELECT COUNT(*) FROM emprunt e WHERE e.media_id = m.id AND e.Statut_Emprunt IN ('emprunté', 'en retard')) as est_emprunte
    FROM media m
    JOIN type t ON m.type_id = t.id
    WHERE m.id = ?
");
$media->execute([$media_id]);
$media = $media->fetch();

if (!$media) {
    header('Location: catalogue.php');
    exit();
}

// Médias similaires
$similaires = $connexion->prepare("
    SELECT * FROM media 
    WHERE type_id = ? AND id != ? 
    LIMIT 4
");
$similaires->execute([$media['type_id'], $media_id]);
$similaires = $similaires->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title><?= $media['Titre'] ?> - Médiathèque Livresse</title>
    <link rel="stylesheet" href="../assets/css/user.css">
</head>
<body>
    <?php include '../user/header-user.php'; ?>

    <main class="details-container">
        <div class="media-details">
            <div class="media-image">
                    <img src="/SAE203/assets/img/<?= slugify($media['Titre']) ?>.jpg" alt="<?= htmlspecialchars($media['Titre']) ?>">
            </div>
            <div class="media-info">
                <h2><?= $media['Titre'] ?></h2>
                <p>Auteur : <?= $media['Auteur'] ?></p>
                <p>Type : <?= $media['Type'] ?></p>
                <p>Année : <?= $media['Date_Parution'] ?></p>
                <p>État : <?= $media['etat_Conservation'] ?></p>
                <div class="disponibilite <?= $media['est_emprunte'] > 0 ? 'indisponible' : 'disponible' ?>">
                    <?= $media['est_emprunte'] > 0 ? 'Indisponible' : 'Disponible' ?>
                </div>
            </div>
        </div>

        <section class="similaires">
            <h2>Médias similaires</h2>
            <div class="similaires-flex">
                <?php foreach ($similaires as $similar): ?>
                    <div class="similaire-card">
                    <img src="/SAE203/assets/img/<?= slugify($similar['Titre']) ?>.jpg" alt="<?= htmlspecialchars($similar['Titre']) ?>">
                        <div class="media-similaire">
                            <h3><?= $similar['Auteur'] ?> - <?= $similar['Titre'] ?></h3>
                            <a href="details.php?id=<?= $similar['id'] ?>" class="btn btn-secondary">Voir</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>
    </main>

     
    <script src="/SAE203/assets/js/user.js"></script>
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/SAE203/user/footer-user.php'; ?>
</body>
</html>