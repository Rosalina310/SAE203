<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/functions.php';

$nouveautes = $connexion->query("
    SELECT m.*, t.Nom as Type 
    FROM media m
    JOIN type t ON m.type_id = t.id
    ORDER BY m.id DESC 
    LIMIT 6
")->fetchAll();

$types = $connexion->query("SELECT * FROM type")->fetchAll();

include $_SERVER['DOCUMENT_ROOT'] . '/SAE203/user/header-user.php';
?>



<section class="hero">
    <div class="hero-content">
        <h1>Bienvenue à la Médiathèque Livresse</h1>
        <p>Découvrez notre collection unique au cœur de Rochefourchat</p>
        <a href="/SAE203/user/catalogue.php" class="btn btn-primary">Explorer le Catalogue</a>
    </div>
</section>

<section class="types-section">
    <h2>Nos Types de Médias</h2>
    <div class="types-flex">
       <?php foreach ($types as $type): ?>
            <?php
                $imageName = str_replace(' ', '-', strtolower($type['Nom'])) . '.png';
                $url = "/SAE203/user/catalogue.php?type=" . urlencode($type['id']);
            ?>
            <div class="type-card">
                <a href="<?= $url ?>">
                    <img src="/SAE203/assets/img/<?= $imageName ?>" alt="<?= htmlspecialchars($type['Nom']) ?>">
                </a>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<section class="nouveautes-section">
    <h2>Dernières Nouveautés</h2>
    <div class="nouveautes-flex">
        <?php foreach ($nouveautes as $media): ?>
            <div class="media-card">
                <div class="media-info">
                    <a href="/SAE203/user/details.php?id=<?= urlencode($media['id']) ?>" class="btn btn-secondary">
                    <img src="/SAE203/assets/img/<?= slugify($media['Titre']) ?>.jpg" alt="<?= htmlspecialchars($media['Titre']) ?>">
                    <p><?= htmlspecialchars($media['Auteur']) ?> - <?= htmlspecialchars($media['Titre']) ?></p></a>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</section>


<?php 
// Inclu$on du footer avec chemin absolu
include $_SERVER['DOCUMENT_ROOT'] . '/SAE203/user/footer-user.php'; 
?>