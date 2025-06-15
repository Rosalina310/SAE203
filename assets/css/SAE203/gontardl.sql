-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 192.168.135.113
-- Généré le : mar. 03 juin 2025 à 07:18
-- Version du serveur : 10.5.13-MariaDB-1:10.5.13+maria~buster
-- Version de PHP : 8.3.3-1+0~20240216.17+debian10~1.gbp87e37b

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gontardl`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`gutzviln`@`src-a235.univ-savoie.fr` PROCEDURE `EmpruntMedia` (IN `p_media_id` INT, IN `p_adherent_id` INT, IN `p_duree_jours` INT)   BEGIN
    DECLARE v_exemplaire_id INT;
    DECLARE v_date_retour DATE;
    
    -- Trouver un exemplaire disponible
    SELECT id INTO v_exemplaire_id
    FROM exemplaire 
    WHERE media_id = p_media_id AND disponible = TRUE
    LIMIT 1;
    
    IF v_exemplaire_id IS NOT NULL THEN
        SET v_date_retour = DATE_ADD(CURDATE(), INTERVAL p_duree_jours DAY);
        
        -- Créer l'emprunt
        INSERT INTO emprunt (media_id, adherent_id, exemplaire_id, Date_Emprunt, Date_Retour_Prévue, Statut_Emprunt)
        VALUES (p_media_id, p_adherent_id, v_exemplaire_id, CURDATE(), v_date_retour, 'emprunté');
        
        -- Marquer l'exemplaire comme indisponible
        UPDATE exemplaire SET disponible = FALSE WHERE id = v_exemplaire_id;
        
        SELECT 'Emprunt créé avec succès' as Message, v_exemplaire_id as Exemplaire_ID;
    ELSE
        SELECT 'Aucun exemplaire disponible' as Message;
    END IF;
END$$

CREATE DEFINER=`gutzviln`@`src-a235.univ-savoie.fr` PROCEDURE `RetourMedia` (IN `p_emprunt_id` INT)   BEGIN
    DECLARE v_exemplaire_id INT;
    
    -- Récupérer l'exemplaire_id de l'emprunt
    SELECT exemplaire_id INTO v_exemplaire_id
    FROM emprunt 
    WHERE ID_Emprunt = p_emprunt_id;
    
    IF v_exemplaire_id IS NOT NULL THEN
        -- Marquer l'emprunt comme rendu
        UPDATE emprunt 
        SET Statut_Emprunt = 'rendu' 
        WHERE ID_Emprunt = p_emprunt_id;
        
        -- Marquer l'exemplaire comme disponible
        UPDATE exemplaire 
        SET disponible = TRUE 
        WHERE id = v_exemplaire_id;
        
        SELECT 'Retour effectué avec succès' as Message;
    ELSE
        SELECT 'Emprunt non trouvé' as Message;
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `adherent`
--

CREATE TABLE `adherent` (
  `id` int(11) NOT NULL,
  `Nom` varchar(45) DEFAULT NULL,
  `Prenom` varchar(45) DEFAULT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `Statut` enum('actif','inactif') DEFAULT 'actif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `adherent`
--

INSERT INTO `adherent` (`id`, `Nom`, `Prenom`, `Email`, `Statut`) VALUES
(1, 'De Jour', 'Adam', 'Adam.De Jour@rochefourchat.com', 'actif'),
(2, 'Labèche', 'Amel', 'Amel.Labèche@rochefourchat.com', 'actif'),
(3, 'Plutoutessatete', 'Anna', 'Anna.Plutoutessatete@rochefourchat.com', 'actif'),
(4, 'Male', 'Annie', 'Annie.Male@rochefourchat.com', 'actif'),
(5, 'Soitil', 'Benny', 'Benny.Soitil@rochefourchat.com', 'actif'),
(6, 'Minie', 'Cathy', 'Cathy.Minie@rochefourchat.com', 'actif'),
(7, 'Dereck', 'Tom', 'Tom.Dereck@rochefourchat.com', 'actif'),
(8, 'Sens', 'Renée', 'Renée.Sens@rochefourchat.com', 'actif'),
(9, 'Amploi', 'Paul', 'Paul.Amploi@rochefourchat.com', 'actif'),
(10, 'Début', 'Jean-Marc', 'Jean-Marc.Début@rochefourchat.com', 'actif'),
(11, 'Coupee', 'Henriette', 'Henriette.Coupee@rochefourchat.com', 'actif'),
(12, 'Vigote', 'Sarah', 'Sarah.Vigote@rochefourchat.com', 'actif'),
(13, 'Xeption', 'Alex', 'Alex.Xeption@rochefourchat.com', 'actif'),
(14, 'Vojambon', 'Andy', 'Andy.Vojambon@rochefourchat.com', 'actif'),
(15, 'Oie', 'Bart', 'Bart.Oie@rochefourchat.com', 'actif'),
(16, 'Christ', 'Alain', 'Alain.Christ@rochefourchat.com', 'actif'),
(17, 'Rable', 'Daisy', 'Daisy.Rable@rochefourchat.com', 'actif'),
(18, 'Técenfote', 'Dick', 'Dick.Técenfote@rochefourchat.com', 'actif'),
(19, 'Fils', 'Lorie', 'Lorie.Fils@rochefourchat.com', 'actif'),
(20, 'Javel', 'Aude', 'Aude.Javel@rochefourchat.com', 'actif'),
(21, 'Patamob', 'Alphonse', '', 'actif'),
(22, 'Kilo', 'Sandy', 'Sandy.Kilo@rochefourchat.com', 'actif'),
(23, 'Kanne', 'Jerry', 'Jerry.Kanne@rochefourchat.com', 'actif'),
(24, 'Dé', 'Bonnie', 'Bonnie.Dé@rochefourchat.com', 'actif'),
(25, 'Diote', 'Kelly', 'Kelly.Diote@rochefourchat.com', 'actif'),
(26, 'Balle', 'Jean', 'Jean.Balle@rochefourchat.com', 'actif'),
(27, 'Houche', 'Jacques', 'Jacques.Houche@rochefourchat.com', 'actif'),
(28, 'Bambelle', 'Larry', 'Larry.Bambelle@rochefourchat.com', 'actif'),
(29, 'Pote', 'Jessica', 'Jessica.Pote@rochefourchat.com', 'actif'),
(30, 'Fiant', 'Eddy', 'Eddy.Fiant@rochefourchat.com', 'actif'),
(31, 'Proviste', 'Alain', 'Alain.Proviste@rochefourchat.com', 'actif'),
(32, 'Lémir', 'Abel', 'Abel.Lémir@rochefourchat.com', 'actif'),
(33, 'Labrosse', 'Adam', 'Adam.Labrosse@rochefourchat.com', 'actif'),
(34, 'Deuf', 'John', 'John.Deuf@rochefourchat.com', 'actif'),
(35, 'Halord', 'Ahmed', 'Ahmed.Halord@rochefourchat.com', 'actif'),
(36, 'Voyant', 'Claire', 'Claire.Voyant@rochefourchat.com', 'actif'),
(37, 'Lemental', 'Debbie', 'Debbie.Lemental@rochefourchat.com', 'actif'),
(38, 'Toir', 'Théodore', 'Théodore.Toir@rochefourchat.com', 'actif'),
(39, 'Mensoif', 'Gérard', 'Gérard.Mensoif@rochefourchat.com', 'actif');

-- --------------------------------------------------------

--
-- Structure de la table `emprunt`
--

CREATE TABLE `emprunt` (
  `media_id` int(11) NOT NULL,
  `exemplaire_id` int(11) DEFAULT NULL,
  `adherent_id` int(11) NOT NULL,
  `Date_Emprunt` date DEFAULT NULL,
  `Date_Retour_Prévue` date DEFAULT NULL,
  `Statut_Emprunt` enum('rendu','en retard','emprunté') NOT NULL DEFAULT 'rendu',
  `ID_Emprunt` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `emprunt`
--

INSERT INTO `emprunt` (`media_id`, `exemplaire_id`, `adherent_id`, `Date_Emprunt`, `Date_Retour_Prévue`, `Statut_Emprunt`, `ID_Emprunt`) VALUES
(1, 1, 1, '2005-04-25', '2005-05-25', 'en retard', 1),
(2, 4, 2, '2015-04-25', '2015-05-25', 'rendu', 2),
(1, 1, 3, '2019-04-25', '2019-05-25', 'rendu', 3),
(4, 8, 4, '2023-04-25', '2022-06-25', 'rendu', 4),
(5, 10, 5, '2027-04-25', '2027-05-25', 'rendu', 5),
(6, 12, 6, '2003-05-25', '2002-06-25', 'rendu', 6),
(7, 14, 7, '2015-05-25', '2014-06-25', 'rendu', 7),
(8, 17, 8, '2025-05-25', '2024-07-25', 'rendu', 8),
(9, 20, 9, '2031-05-25', '2030-07-25', 'rendu', 9),
(10, 22, 10, '2006-06-25', '2005-08-25', 'rendu', 10),
(11, 24, 11, '2022-06-25', '2022-07-25', 'rendu', 11),
(12, 27, 12, '2028-07-25', '2029-09-25', 'rendu', 12),
(13, 30, 13, '2011-04-25', '2011-05-25', 'rendu', 13),
(14, 33, 14, '2017-04-25', '2017-05-25', 'rendu', 14),
(15, 36, 15, '2025-04-25', '2025-05-25', 'rendu', 15),
(16, 38, 16, '2005-05-25', '2004-06-25', 'rendu', 16),
(17, 40, 17, '2009-05-25', '2008-06-25', 'rendu', 17),
(18, 43, 7, '2013-05-25', '2012-06-25', 'rendu', 18),
(19, 46, 7, '2017-05-25', '2016-06-25', 'rendu', 19),
(20, 49, 18, '2019-05-25', '2018-06-25', 'rendu', 20),
(21, 52, 12, '2023-05-25', '2022-07-25', 'rendu', 21),
(22, 55, 19, '2002-06-25', '2001-08-25', 'rendu', 22),
(23, 58, 3, '2024-07-25', '2025-09-25', 'rendu', 23),
(24, 61, 3, '2026-07-25', '2027-09-25', 'rendu', 24),
(25, 64, 20, '2003-08-25', '2002-09-25', 'rendu', 25),
(26, 68, 21, '2013-04-25', '2013-05-25', 'rendu', 26),
(27, 73, 4, '2021-04-25', '2021-05-25', 'rendu', 27),
(28, 76, 8, '2029-05-25', '2028-07-25', 'rendu', 28),
(29, 80, 22, '2010-06-25', '2010-07-25', 'rendu', 29),
(31, 87, 23, '2026-06-25', '2026-07-25', 'rendu', 30),
(32, 91, 16, '2028-06-25', '2028-07-25', 'rendu', 31),
(33, 94, 24, '2020-07-25', '2021-09-25', 'rendu', 32),
(34, 96, 11, '2022-07-25', '2023-09-25', 'rendu', 33),
(35, 100, 1, '2030-07-25', '2001-10-25', 'rendu', 34),
(36, 105, 1, '2001-08-25', '2003-10-25', 'rendu', 35),
(37, 109, 12, '2005-08-25', '2004-09-25', 'rendu', 36),
(38, 114, 16, '2011-08-25', '2010-09-25', 'rendu', 37),
(39, 117, 25, '2008-03-25', '2007-04-25', 'rendu', 38),
(40, 119, 26, '2010-03-25', '2009-04-25', 'rendu', 39),
(41, 122, 26, '2012-03-25', '2011-04-25', 'rendu', 40),
(42, 127, 11, '2014-03-25', '2013-04-25', 'rendu', 41),
(43, 129, 27, '2016-03-25', '2015-04-25', 'rendu', 42),
(44, 131, 28, '2018-03-25', '2017-04-25', 'rendu', 43),
(45, 134, 23, '2020-03-25', '2019-04-25', 'rendu', 44),
(46, 136, 29, '2022-03-25', '2021-04-25', 'rendu', 45),
(47, 138, 30, '2024-03-25', '2023-04-25', 'rendu', 46),
(48, 140, 22, '2026-03-25', '2025-04-25', 'rendu', 47),
(49, 143, 31, '2028-03-25', '2027-04-25', 'rendu', 48),
(50, 145, 20, '2030-03-25', '2029-04-25', 'rendu', 49),
(51, 149, 32, '2001-04-25', '2001-05-25', 'rendu', 50),
(52, 154, 33, '2003-04-25', '2003-05-25', 'rendu', 51),
(53, 156, 8, '2027-05-25', '2026-07-25', 'rendu', 52),
(54, 160, 34, '2004-06-25', '2003-08-25', 'rendu', 53),
(55, 164, 22, '2012-06-25', '2012-07-25', 'rendu', 54),
(56, 170, 22, '2014-06-25', '2014-07-25', 'rendu', 55),
(57, 174, 27, '2016-06-25', '2016-07-25', 'rendu', 56),
(58, 177, 23, '2018-06-25', '2018-07-25', 'rendu', 57),
(59, 182, 27, '2030-06-25', '2030-07-25', 'rendu', 58),
(60, 185, 19, '2004-07-25', '2003-08-25', 'rendu', 59),
(59, 182, 20, '2006-07-25', '2005-08-25', 'rendu', 60),
(60, 185, 27, '2010-07-25', '2009-08-25', 'rendu', 61),
(61, 189, 24, '2018-07-25', '2019-09-25', 'rendu', 62),
(62, 191, 19, '2007-08-25', '2006-09-25', 'rendu', 63),
(64, 201, 12, '2013-08-25', '2012-09-25', 'rendu', 64),
(65, 206, 1, '2007-04-25', '2007-05-25', 'rendu', 65),
(66, 209, 35, '2009-04-25', '2009-05-25', 'rendu', 66),
(67, 211, 24, '2029-04-25', '2029-05-25', 'rendu', 67),
(68, 213, 24, '2001-05-25', '2031-05-25', 'rendu', 68),
(69, 216, 36, '2007-05-25', '2006-06-25', 'rendu', 69),
(70, 219, 37, '2011-05-25', '2010-06-25', 'rendu', 70),
(71, 222, 38, '2021-05-25', '2020-07-25', 'rendu', 71),
(72, 225, 39, '2008-06-25', '2007-08-25', 'rendu', 72),
(73, 227, 11, '2020-06-25', '2020-07-25', 'rendu', 73),
(74, 230, 19, '2002-07-25', '2001-08-25', 'rendu', 74),
(74, 230, 20, '2008-07-25', '2007-08-25', 'rendu', 75),
(74, 230, 23, '2014-07-25', '2015-09-25', 'rendu', 76),
(75, 233, 23, '2016-07-25', '2017-09-25', 'rendu', 77);

-- --------------------------------------------------------

--
-- Structure de la table `exemplaire`
--

CREATE TABLE `exemplaire` (
  `id` int(11) NOT NULL,
  `media_id` int(11) NOT NULL,
  `numero_exemplaire` int(11) NOT NULL,
  `etat_conservation` enum('neuf','bon etat','mauvais etat') DEFAULT 'bon etat',
  `disponible` tinyint(1) DEFAULT 1,
  `date_acquisition` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `exemplaire`
--

INSERT INTO `exemplaire` (`id`, `media_id`, `numero_exemplaire`, `etat_conservation`, `disponible`, `date_acquisition`) VALUES
(1, 1, 1, 'bon etat', 1, NULL),
(2, 1, 2, 'bon etat', 1, NULL),
(3, 1, 3, 'bon etat', 1, NULL),
(4, 2, 1, 'bon etat', 1, NULL),
(5, 3, 1, 'bon etat', 1, NULL),
(6, 3, 2, 'bon etat', 1, NULL),
(7, 3, 3, 'bon etat', 1, NULL),
(8, 4, 1, 'bon etat', 1, NULL),
(9, 4, 2, 'bon etat', 1, NULL),
(10, 5, 1, 'bon etat', 1, NULL),
(11, 5, 2, 'bon etat', 1, NULL),
(12, 6, 1, 'bon etat', 1, NULL),
(13, 6, 2, 'bon etat', 1, NULL),
(14, 7, 1, 'bon etat', 1, NULL),
(15, 7, 2, 'bon etat', 1, NULL),
(16, 7, 3, 'bon etat', 1, NULL),
(17, 8, 1, 'bon etat', 1, NULL),
(18, 8, 2, 'bon etat', 1, NULL),
(19, 8, 3, 'bon etat', 1, NULL),
(20, 9, 1, 'bon etat', 1, NULL),
(21, 9, 2, 'bon etat', 1, NULL),
(22, 10, 1, 'bon etat', 1, NULL),
(23, 10, 2, 'bon etat', 1, NULL),
(24, 11, 1, 'bon etat', 1, NULL),
(25, 11, 2, 'bon etat', 1, NULL),
(26, 11, 3, 'bon etat', 1, NULL),
(27, 12, 1, 'bon etat', 1, NULL),
(28, 12, 2, 'bon etat', 1, NULL),
(29, 12, 3, 'bon etat', 1, NULL),
(30, 13, 1, 'bon etat', 1, NULL),
(31, 13, 2, 'bon etat', 1, NULL),
(32, 13, 3, 'bon etat', 1, NULL),
(33, 14, 1, 'bon etat', 1, NULL),
(34, 14, 2, 'bon etat', 1, NULL),
(35, 14, 3, 'bon etat', 1, NULL),
(36, 15, 1, 'bon etat', 1, NULL),
(37, 15, 2, 'bon etat', 1, NULL),
(38, 16, 1, 'bon etat', 1, NULL),
(39, 16, 2, 'bon etat', 1, NULL),
(40, 17, 1, 'bon etat', 1, NULL),
(41, 17, 2, 'bon etat', 1, NULL),
(42, 17, 3, 'bon etat', 1, NULL),
(43, 18, 1, 'bon etat', 1, NULL),
(44, 18, 2, 'bon etat', 1, NULL),
(45, 18, 3, 'bon etat', 1, NULL),
(46, 19, 1, 'bon etat', 1, NULL),
(47, 19, 2, 'bon etat', 1, NULL),
(48, 19, 3, 'bon etat', 1, NULL),
(49, 20, 1, 'bon etat', 1, NULL),
(50, 20, 2, 'bon etat', 1, NULL),
(51, 20, 3, 'bon etat', 1, NULL),
(52, 21, 1, 'bon etat', 1, NULL),
(53, 21, 2, 'bon etat', 1, NULL),
(54, 21, 3, 'bon etat', 1, NULL),
(55, 22, 1, 'bon etat', 1, NULL),
(56, 22, 2, 'bon etat', 1, NULL),
(57, 22, 3, 'bon etat', 1, NULL),
(58, 23, 1, 'bon etat', 1, NULL),
(59, 23, 2, 'bon etat', 1, NULL),
(60, 23, 3, 'bon etat', 1, NULL),
(61, 24, 1, 'bon etat', 1, NULL),
(62, 24, 2, 'bon etat', 1, NULL),
(63, 24, 3, 'bon etat', 1, NULL),
(64, 25, 1, 'bon etat', 1, NULL),
(65, 25, 2, 'bon etat', 1, NULL),
(66, 25, 3, 'bon etat', 1, NULL),
(67, 25, 4, 'bon etat', 1, NULL),
(68, 26, 1, 'bon etat', 1, NULL),
(69, 26, 2, 'bon etat', 1, NULL),
(70, 26, 3, 'bon etat', 1, NULL),
(71, 26, 4, 'bon etat', 1, NULL),
(72, 26, 5, 'bon etat', 1, NULL),
(73, 27, 1, 'bon etat', 1, NULL),
(74, 27, 2, 'bon etat', 1, NULL),
(75, 27, 3, 'bon etat', 1, NULL),
(76, 28, 1, 'bon etat', 1, NULL),
(77, 28, 2, 'bon etat', 1, NULL),
(78, 28, 3, 'bon etat', 1, NULL),
(79, 28, 4, 'bon etat', 1, NULL),
(80, 29, 1, 'bon etat', 1, NULL),
(81, 29, 2, 'bon etat', 1, NULL),
(82, 30, 1, 'bon etat', 1, NULL),
(83, 30, 2, 'bon etat', 1, NULL),
(84, 30, 3, 'bon etat', 1, NULL),
(85, 30, 4, 'bon etat', 1, NULL),
(86, 30, 5, 'bon etat', 1, NULL),
(87, 31, 1, 'bon etat', 1, NULL),
(88, 31, 2, 'bon etat', 1, NULL),
(89, 31, 3, 'bon etat', 1, NULL),
(90, 31, 4, 'bon etat', 1, NULL),
(91, 32, 1, 'bon etat', 1, NULL),
(92, 32, 2, 'bon etat', 1, NULL),
(93, 32, 3, 'bon etat', 1, NULL),
(94, 33, 1, 'bon etat', 1, NULL),
(95, 33, 2, 'bon etat', 1, NULL),
(96, 34, 1, 'bon etat', 1, NULL),
(97, 34, 2, 'bon etat', 1, NULL),
(98, 34, 3, 'bon etat', 1, NULL),
(99, 34, 4, 'bon etat', 1, NULL),
(100, 35, 1, 'bon etat', 1, NULL),
(101, 35, 2, 'bon etat', 1, NULL),
(102, 35, 3, 'bon etat', 1, NULL),
(103, 35, 4, 'bon etat', 1, NULL),
(104, 35, 5, 'bon etat', 1, NULL),
(105, 36, 1, 'bon etat', 1, NULL),
(106, 36, 2, 'bon etat', 1, NULL),
(107, 36, 3, 'bon etat', 1, NULL),
(108, 36, 4, 'bon etat', 1, NULL),
(109, 37, 1, 'bon etat', 1, NULL),
(110, 37, 2, 'bon etat', 1, NULL),
(111, 37, 3, 'bon etat', 1, NULL),
(112, 37, 4, 'bon etat', 1, NULL),
(113, 37, 5, 'bon etat', 1, NULL),
(114, 38, 1, 'bon etat', 1, NULL),
(115, 38, 2, 'bon etat', 1, NULL),
(116, 38, 3, 'bon etat', 1, NULL),
(117, 39, 1, 'bon etat', 1, NULL),
(118, 39, 2, 'bon etat', 1, NULL),
(119, 40, 1, 'bon etat', 1, NULL),
(120, 40, 2, 'bon etat', 1, NULL),
(121, 40, 3, 'bon etat', 1, NULL),
(122, 41, 1, 'bon etat', 1, NULL),
(123, 41, 2, 'bon etat', 1, NULL),
(124, 41, 3, 'bon etat', 1, NULL),
(125, 41, 4, 'bon etat', 1, NULL),
(126, 41, 5, 'bon etat', 1, NULL),
(127, 42, 1, 'bon etat', 1, NULL),
(128, 42, 2, 'bon etat', 1, NULL),
(129, 43, 1, 'bon etat', 1, NULL),
(130, 43, 2, 'bon etat', 1, NULL),
(131, 44, 1, 'bon etat', 1, NULL),
(132, 44, 2, 'bon etat', 1, NULL),
(133, 44, 3, 'bon etat', 1, NULL),
(134, 45, 1, 'bon etat', 1, NULL),
(135, 45, 2, 'bon etat', 1, NULL),
(136, 46, 1, 'bon etat', 1, NULL),
(137, 46, 2, 'bon etat', 1, NULL),
(138, 47, 1, 'bon etat', 1, NULL),
(139, 47, 2, 'bon etat', 1, NULL),
(140, 48, 1, 'bon etat', 1, NULL),
(141, 48, 2, 'bon etat', 1, NULL),
(142, 48, 3, 'bon etat', 1, NULL),
(143, 49, 1, 'bon etat', 1, NULL),
(144, 49, 2, 'bon etat', 1, NULL),
(145, 50, 1, 'bon etat', 1, NULL),
(146, 50, 2, 'bon etat', 1, NULL),
(147, 50, 3, 'bon etat', 1, NULL),
(148, 50, 4, 'bon etat', 1, NULL),
(149, 51, 1, 'bon etat', 1, NULL),
(150, 51, 2, 'bon etat', 1, NULL),
(151, 51, 3, 'bon etat', 1, NULL),
(152, 51, 4, 'bon etat', 1, NULL),
(153, 51, 5, 'bon etat', 1, NULL),
(154, 52, 1, 'bon etat', 1, NULL),
(155, 52, 2, 'bon etat', 1, NULL),
(156, 53, 1, 'bon etat', 1, NULL),
(157, 53, 2, 'bon etat', 1, NULL),
(158, 53, 3, 'bon etat', 1, NULL),
(159, 53, 4, 'bon etat', 1, NULL),
(160, 54, 1, 'bon etat', 1, NULL),
(161, 54, 2, 'bon etat', 1, NULL),
(162, 54, 3, 'bon etat', 1, NULL),
(163, 54, 4, 'bon etat', 1, NULL),
(164, 55, 1, 'bon etat', 1, NULL),
(165, 55, 2, 'bon etat', 1, NULL),
(166, 55, 3, 'bon etat', 1, NULL),
(167, 55, 4, 'bon etat', 1, NULL),
(168, 55, 5, 'bon etat', 1, NULL),
(169, 55, 6, 'bon etat', 1, NULL),
(170, 56, 1, 'bon etat', 1, NULL),
(171, 56, 2, 'bon etat', 1, NULL),
(172, 56, 3, 'bon etat', 1, NULL),
(173, 56, 4, 'bon etat', 1, NULL),
(174, 57, 1, 'bon etat', 1, NULL),
(175, 57, 2, 'bon etat', 1, NULL),
(176, 57, 3, 'bon etat', 1, NULL),
(177, 58, 1, 'bon etat', 1, NULL),
(178, 58, 2, 'bon etat', 1, NULL),
(179, 58, 3, 'bon etat', 1, NULL),
(180, 58, 4, 'bon etat', 1, NULL),
(181, 58, 5, 'bon etat', 1, NULL),
(182, 59, 1, 'bon etat', 1, NULL),
(183, 59, 2, 'bon etat', 1, NULL),
(184, 59, 3, 'bon etat', 1, NULL),
(185, 60, 1, 'bon etat', 1, NULL),
(186, 60, 2, 'bon etat', 1, NULL),
(187, 60, 3, 'bon etat', 1, NULL),
(188, 60, 4, 'bon etat', 1, NULL),
(189, 61, 1, 'bon etat', 1, NULL),
(190, 61, 2, 'bon etat', 1, NULL),
(191, 62, 1, 'bon etat', 1, NULL),
(192, 62, 2, 'bon etat', 1, NULL),
(193, 62, 3, 'bon etat', 1, NULL),
(194, 62, 4, 'bon etat', 1, NULL),
(195, 62, 5, 'bon etat', 1, NULL),
(196, 62, 6, 'bon etat', 1, NULL),
(197, 63, 1, 'bon etat', 1, NULL),
(198, 63, 2, 'bon etat', 1, NULL),
(199, 63, 3, 'bon etat', 1, NULL),
(200, 63, 4, 'bon etat', 1, NULL),
(201, 64, 1, 'bon etat', 1, NULL),
(202, 64, 2, 'bon etat', 1, NULL),
(203, 64, 3, 'bon etat', 1, NULL),
(204, 64, 4, 'bon etat', 1, NULL),
(205, 64, 5, 'bon etat', 1, NULL),
(206, 65, 1, 'bon etat', 1, NULL),
(207, 65, 2, 'bon etat', 1, NULL),
(208, 65, 3, 'bon etat', 1, NULL),
(209, 66, 1, 'bon etat', 1, NULL),
(210, 66, 2, 'bon etat', 1, NULL),
(211, 67, 1, 'bon etat', 1, NULL),
(212, 67, 2, 'bon etat', 1, NULL),
(213, 68, 1, 'bon etat', 1, NULL),
(214, 68, 2, 'bon etat', 1, NULL),
(215, 68, 3, 'bon etat', 1, NULL),
(216, 69, 1, 'bon etat', 1, NULL),
(217, 69, 2, 'bon etat', 1, NULL),
(218, 69, 3, 'bon etat', 1, NULL),
(219, 70, 1, 'bon etat', 1, NULL),
(220, 70, 2, 'bon etat', 1, NULL),
(221, 70, 3, 'bon etat', 1, NULL),
(222, 71, 1, 'bon etat', 1, NULL),
(223, 71, 2, 'bon etat', 1, NULL),
(224, 71, 3, 'bon etat', 1, NULL),
(225, 72, 1, 'bon etat', 1, NULL),
(226, 72, 2, 'bon etat', 1, NULL),
(227, 73, 1, 'bon etat', 1, NULL),
(228, 73, 2, 'bon etat', 1, NULL),
(229, 73, 3, 'bon etat', 1, NULL),
(230, 74, 1, 'bon etat', 1, NULL),
(231, 74, 2, 'bon etat', 1, NULL),
(232, 74, 3, 'bon etat', 1, NULL),
(233, 75, 1, 'bon etat', 1, NULL),
(234, 75, 2, 'bon etat', 1, NULL),
(235, 75, 3, 'bon etat', 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `media`
--

CREATE TABLE `media` (
  `id` int(11) NOT NULL,
  `Titre` varchar(45) DEFAULT NULL,
  `Auteur` varchar(45) DEFAULT NULL,
  `Editeur` varchar(45) DEFAULT NULL,
  `Date_Parution` varchar(45) DEFAULT NULL,
  `Genre` varchar(45) DEFAULT NULL,
  `etat_Conservation` enum('neuf','bon etat','mauvaise etat') DEFAULT 'bon etat',
  `type_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `media`
--

INSERT INTO `media` (`id`, `Titre`, `Auteur`, `Editeur`, `Date_Parution`, `Genre`, `etat_Conservation`, `type_id`) VALUES
(1, 'Sgt. Pepper\'s Lonely Hearts Club Band', 'The Beatles', 'Parlophone', '1967', 'Rock', 'bon etat', 1),
(2, 'The Dark Side of the Moon', 'Pink Floyd', 'Harvest Records', '1973', 'Rock Progressif', 'bon etat', 1),
(3, 'The Best of The Doors', 'The Doors', 'Elektra Records', '1973', 'Rock', 'bon etat', 1),
(4, 'The Best of Elton John', 'Elton John', 'MCA Records', '1974', 'Pop', 'bon etat', 1),
(5, 'The Best of ABBA', 'ABBA', 'Polar Music', '1975', 'Pop', 'bon etat', 1),
(6, 'Rumours', 'Fleetwood Mac', 'Warner Bros', '1977', 'Rock', 'bon etat', 1),
(7, 'The Best of Queen', 'Queen', 'EMI Records', '1981', 'Rock', 'bon etat', 1),
(8, 'The Joshua Tree', 'U2', 'Island Records', '1987', 'Rock', 'bon etat', 1),
(9, 'The Immaculate Collection', 'Madonna', 'Sire Records', '1990', 'Pop', 'bon etat', 1),
(10, 'The Bodyguard', 'Whitney Houston', 'Arista Records', '1992', 'Soundtrack', 'bon etat', 1),
(11, 'The Marshall Mathers LP', 'Eminem', 'Aftermath Entertainment', '2000', 'Hip-Hop', 'bon etat', 1),
(12, 'Back to Black', 'Amy Winehouse', 'Island Records', '2006', 'Soul', 'bon etat', 1),
(13, 'Led Zeppelin IV', 'Led Zeppelin', 'Atlantic Records', '1971', 'Rock', 'bon etat', 2),
(14, 'The Best of The Doors', 'The Doors', 'Elektra Records', '1973', 'Rock', 'bon etat', 2),
(15, 'The Best of ABBA', 'ABBA', 'Polar Music', '1975', 'Pop', 'bon etat', 2),
(16, 'Bat Out of Hell', 'Meat Loaf', 'Cleveland International Records', '1977', 'Rock', 'bon etat', 2),
(17, 'Back in Black', 'AC/DC', 'Atlantic Records', '1980', 'Hard Rock', 'bon etat', 2),
(18, 'The Best of David Bowie', 'David Bowie', 'EMI Records', '1980', 'Rock', 'bon etat', 2),
(19, 'The Best of Queen', 'Queen', 'EMI Records', '1981', 'Rock', 'bon etat', 2),
(20, 'Thriller', 'Michael Jackson', 'Epic Records', '1982', 'Musique Pop', 'bon etat', 2),
(21, 'The Best of Bob Marley', 'Bob Marley', 'Island Records', '1984', 'Reggae', 'bon etat', 2),
(22, 'Nevermind', 'Nirvana', 'DGC Records', '1991', 'Grunge', 'bon etat', 2),
(23, 'American Idiot', 'Green Day', 'Reprise Records', '2004', 'Punk Rock', 'bon etat', 2),
(24, 'The Essential Michael Jackson', 'Michael Jackson', 'Epic Records', '2005', 'Pop', 'bon etat', 2),
(25, '21', 'Adele', 'XL Recordings', '2011', 'Pop', 'bon etat', 2),
(26, 'Le Parrain', 'Francis Ford Coppola', 'Paramount Pictures', '1972', 'Drame', 'bon etat', 3),
(27, 'Le Parrain II', 'Francis Ford Coppola', 'Paramount Pictures', '1974', 'Drame', 'bon etat', 3),
(28, 'Le Grand Bleu', 'Luc Besson', 'Gaumont', '1988', 'Drame', 'bon etat', 3),
(29, 'La Liste de Schindler', 'Steven Spielberg', 'Universal Pictures', '1993', 'Drame', 'bon etat', 3),
(30, 'Gladiator', 'Ridley Scott', 'DreamWorks Pictures', '2000', 'Action', 'bon etat', 3),
(31, 'Le Fabuleux Destin d\'Amélie Poulain', 'Jean-Pierre Jeunet', 'UGC-Fox Distribution', '2001', 'Comédie', 'bon etat', 3),
(32, 'Le Voyage de Chihiro', 'Hayao Miyazaki', 'Studio Ghibli', '2001', 'Animation', 'bon etat', 3),
(33, 'Le Pianiste', 'Roman Polanski', 'Focus Features', '2002', 'Drame', 'bon etat', 3),
(34, 'Le Seigneur des Anneaux : Le Retour du roi', 'Peter Jackson', 'New Line Cinema', '2003', 'Fantastique', 'bon etat', 3),
(35, 'Avatar', 'James Cameron', '20th Century Fox', '2009', 'Science-Fiction', 'bon etat', 3),
(36, 'Inception', 'Christopher Nolan', 'Warner Bros', '2010', 'Science-Fiction', 'bon etat', 3),
(37, 'Le Loup de Wall Street', 'Martin Scorsese', 'Paramount Pictures', '2013', 'Biographie', 'bon etat', 3),
(38, 'La La Land', 'Damien Chazelle', 'Lionsgate', '2016', 'Musical', 'bon etat', 3),
(39, 'Les Liaisons dangereuses', 'Pierre Choderlos de Laclos', 'Durand Neveu', '1782', 'Roman Épistolaire', 'bon etat', 4),
(40, 'Le Père Goriot', 'Honoré de Balzac', 'Werdet et Lecou', '1835', 'Roman Réaliste', 'bon etat', 4),
(41, 'Les Trois Mousquetaires', 'Alexandre Dumas', 'Baudry', '1844', 'Aventure', 'bon etat', 4),
(42, 'Les Hauts de Hurlevent', 'Emily Brontë', 'Thomas Cautley Newby', '1847', 'Roman Gothique', 'bon etat', 4),
(43, 'Moby Dick', 'Herman Melville', 'Richard Bentley', '1851', 'Aventure', 'bon etat', 4),
(44, 'Les Misérables', 'Victor Hugo', 'Hachette', '1862', 'Roman Historique', 'bon etat', 4),
(45, 'L\'Odyssée', 'Homère', 'Traduction par Leconte de Lisle', '1867', 'Épopée', 'bon etat', 4),
(46, 'Guerre et Paix', 'Léon Tolstoï', 'Fayard', '1869', 'Roman Historique', 'bon etat', 4),
(47, 'Le Tour du monde en quatre-vingts jours', 'Jules Verne', 'Pierre-Jules Hetzel', '1873', 'Aventure', 'bon etat', 4),
(48, 'Les Contes de la bécasse', 'Guy de Maupassant', 'Victor Havard', '1883', 'Nouvelles', 'bon etat', 4),
(49, 'Le Portrait de Dorian Gray', 'Oscar Wilde', 'Ward, Lock and Company', '1890', 'Roman Gothique', 'bon etat', 4),
(50, 'Le Meilleur des mondes', 'Aldous Huxley', 'Chatto & Windus', '1932', 'Dystopie', 'bon etat', 4),
(51, 'Le Petit Prince', 'Antoine de Saint-Exupéry', 'Gallimard', '1943', 'Littérature', 'bon etat', 4),
(52, '1984', 'George Orwell', 'Secker & Warburg', '1949', 'Dystopie', 'bon etat', 4),
(53, 'Le Grand Bleu', 'Luc Besson', 'Gaumont', '1988', 'Drame', 'bon etat', 5),
(54, 'Le Silence des agneaux', 'Jonathan Demme', 'Orion Pictures', '1991', 'Thriller', 'bon etat', 5),
(55, 'Le Roi Lion', 'Roger Allers', 'Walt Disney Pictures', '1994', 'Animation', 'bon etat', 5),
(56, 'Forrest Gump', 'Robert Zemeckis', 'Paramount Pictures', '1994', 'Drame', 'bon etat', 5),
(57, 'Titanic', 'James Cameron', '20th Century Fox', '1997', 'Romance', 'bon etat', 5),
(58, 'Gladiator', 'Ridley Scott', 'DreamWorks Pictures', '2000', 'Action', 'bon etat', 5),
(59, 'Le Voyage de Chihiro', 'Hayao Miyazaki', 'Studio Ghibli', '2001', 'Animation', 'bon etat', 5),
(60, 'Le Fabuleux Destin d\'Amélie Poulain', 'Jean-Pierre Jeunet', 'UGC-Fox Distribution', '2001', 'Comédie', 'bon etat', 5),
(61, 'Le Pianiste', 'Roman Polanski', 'Focus Features', '2002', 'Drame', 'bon etat', 5),
(62, 'La Reine des neiges', 'Chris Buck', 'Walt Disney Pictures', '2013', 'Animation', 'bon etat', 5),
(63, 'Interstellar', 'Christopher Nolan', 'Paramount Pictures', '2014', 'Science-Fiction', 'bon etat', 5),
(64, 'Le Roi Lion', 'Jon Favreau', 'Walt Disney Pictures', '2019', 'Animation', 'bon etat', 5),
(65, 'The Beatles', 'The Beatles', 'Apple Records', '1968', 'Rock', 'bon etat', 6),
(66, 'Abbey Road', 'The Beatles', 'Apple Records', '1969', 'Rock', 'bon etat', 6),
(67, 'Hotel California', 'Eagles', 'Asylum Records', '1976', 'Rock', 'bon etat', 6),
(68, 'Their Greatest Hits (1971-1975)', 'Eagles', 'Asylum Records', '1976', 'Rock', 'bon etat', 6),
(69, 'The Wall', 'Pink Floyd', 'Harvest Records', '1979', 'Rock Progressif', 'bon etat', 6),
(70, 'The Best of David Bowie', 'David Bowie', 'EMI Records', '1980', 'Rock', 'bon etat', 6),
(71, 'Born in the U.S.A.', 'Bruce Springsteen', 'Columbia Records', '1984', 'Rock', 'bon etat', 6),
(72, 'The Chronic', 'Dr. Dre', 'Death Row Records', '1992', 'Hip-Hop', 'bon etat', 6),
(73, 'Hybrid Theory', 'Linkin Park', 'Warner Bros', '2000', 'Rock Alternatif', 'bon etat', 6),
(74, 'The Very Best of Prince', 'Prince', 'Warner Bros', '2001', 'Funk', 'bon etat', 6),
(75, 'The Eminem Show', 'Eminem', 'Aftermath Entertainment', '2002', 'Hip-Hop', 'bon etat', 6);

-- --------------------------------------------------------

--
-- Structure de la table `pma__bookmark`
--

CREATE TABLE `pma__bookmark` (
  `id` int(10) UNSIGNED NOT NULL,
  `dbase` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `user` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `label` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `query` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Bookmarks';

-- --------------------------------------------------------

--
-- Structure de la table `pma__central_columns`
--

CREATE TABLE `pma__central_columns` (
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `col_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `col_type` varchar(64) COLLATE utf8_bin NOT NULL,
  `col_length` text COLLATE utf8_bin DEFAULT NULL,
  `col_collation` varchar(64) COLLATE utf8_bin NOT NULL,
  `col_isNull` tinyint(1) NOT NULL,
  `col_extra` varchar(255) COLLATE utf8_bin DEFAULT '',
  `col_default` text COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Central list of columns';

-- --------------------------------------------------------

--
-- Structure de la table `pma__column_info`
--

CREATE TABLE `pma__column_info` (
  `id` int(5) UNSIGNED NOT NULL,
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `column_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `comment` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `mimetype` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `transformation` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `transformation_options` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `input_transformation` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `input_transformation_options` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Column information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Structure de la table `pma__designer_settings`
--

CREATE TABLE `pma__designer_settings` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `settings_data` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Settings related to Designer';

--
-- Déchargement des données de la table `pma__designer_settings`
--

INSERT INTO `pma__designer_settings` (`username`, `settings_data`) VALUES
('gutzviln', '{\"snap_to_grid\":\"off\",\"relation_lines\":\"true\",\"angular_direct\":\"direct\"}');

-- --------------------------------------------------------

--
-- Structure de la table `pma__export_templates`
--

CREATE TABLE `pma__export_templates` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `export_type` varchar(10) COLLATE utf8_bin NOT NULL,
  `template_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `template_data` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved export templates';

-- --------------------------------------------------------

--
-- Structure de la table `pma__favorite`
--

CREATE TABLE `pma__favorite` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `tables` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Favorite tables';

-- --------------------------------------------------------

--
-- Structure de la table `pma__history`
--

CREATE TABLE `pma__history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `db` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `table` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp(),
  `sqlquery` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='SQL history for phpMyAdmin';

-- --------------------------------------------------------

--
-- Structure de la table `pma__navigationhiding`
--

CREATE TABLE `pma__navigationhiding` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `item_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `item_type` varchar(64) COLLATE utf8_bin NOT NULL,
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Hidden items of navigation tree';

-- --------------------------------------------------------

--
-- Structure de la table `pma__pdf_pages`
--

CREATE TABLE `pma__pdf_pages` (
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `page_nr` int(10) UNSIGNED NOT NULL,
  `page_descr` varchar(50) CHARACTER SET utf8 NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='PDF relation pages for phpMyAdmin';

-- --------------------------------------------------------

--
-- Structure de la table `pma__recent`
--

CREATE TABLE `pma__recent` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `tables` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Recently accessed tables';

--
-- Déchargement des données de la table `pma__recent`
--

INSERT INTO `pma__recent` (`username`, `tables`) VALUES
('gutzviln', '[{\"db\":\"gutzviln\",\"table\":\"emprunt\"},{\"db\":\"gutzviln\",\"table\":\"media\"},{\"db\":\"gutzviln\",\"table\":\"adherent\"},{\"db\":\"gutzviln\",\"table\":\"type\"},{\"db\":\"gutzviln\",\"table\":\"Table Type\"},{\"db\":\"gutzviln\",\"table\":\"table M\\u00e9dia\"},{\"db\":\"gutzviln\",\"table\":\"Table Adh\\u00e9rent\"},{\"db\":\"gutzviln\",\"table\":\"pma__central_columns\"},{\"db\":\"gutzviln\",\"table\":\"pma__bookmark\"}]');

-- --------------------------------------------------------

--
-- Structure de la table `pma__relation`
--

CREATE TABLE `pma__relation` (
  `master_db` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `master_table` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `master_field` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `foreign_db` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `foreign_table` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `foreign_field` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Relation table';

-- --------------------------------------------------------

--
-- Structure de la table `pma__savedsearches`
--

CREATE TABLE `pma__savedsearches` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `search_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `search_data` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved searches';

-- --------------------------------------------------------

--
-- Structure de la table `pma__table_coords`
--

CREATE TABLE `pma__table_coords` (
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `pdf_page_number` int(11) NOT NULL DEFAULT 0,
  `x` float UNSIGNED NOT NULL DEFAULT 0,
  `y` float UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table coordinates for phpMyAdmin PDF output';

-- --------------------------------------------------------

--
-- Structure de la table `pma__table_info`
--

CREATE TABLE `pma__table_info` (
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',
  `display_field` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Structure de la table `pma__table_uiprefs`
--

CREATE TABLE `pma__table_uiprefs` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `prefs` text COLLATE utf8_bin NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Tables'' UI preferences';

--
-- Déchargement des données de la table `pma__table_uiprefs`
--

INSERT INTO `pma__table_uiprefs` (`username`, `db_name`, `table_name`, `prefs`, `last_update`) VALUES
('gutzviln', 'gutzviln', 'emprunt', '{\"sorted_col\":\"`emprunt`.`ID_Emprunt` ASC\"}', '2025-05-27 14:08:02'),
('gutzviln', 'gutzviln', 'media', '[]', '2025-05-21 08:50:56');

-- --------------------------------------------------------

--
-- Structure de la table `pma__tracking`
--

CREATE TABLE `pma__tracking` (
  `db_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `table_name` varchar(64) COLLATE utf8_bin NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `schema_snapshot` text COLLATE utf8_bin NOT NULL,
  `schema_sql` text COLLATE utf8_bin DEFAULT NULL,
  `data_sql` longtext COLLATE utf8_bin DEFAULT NULL,
  `tracking` set('UPDATE','REPLACE','INSERT','DELETE','TRUNCATE','CREATE DATABASE','ALTER DATABASE','DROP DATABASE','CREATE TABLE','ALTER TABLE','RENAME TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','ALTER VIEW','DROP VIEW') COLLATE utf8_bin DEFAULT NULL,
  `tracking_active` int(1) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Database changes tracking for phpMyAdmin';

-- --------------------------------------------------------

--
-- Structure de la table `pma__userconfig`
--

CREATE TABLE `pma__userconfig` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `config_data` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User preferences storage for phpMyAdmin';

--
-- Déchargement des données de la table `pma__userconfig`
--

INSERT INTO `pma__userconfig` (`username`, `timevalue`, `config_data`) VALUES
('gutzviln', '2025-05-27 13:36:23', '{\"Console\\/Mode\":\"collapse\",\"lang\":\"fr\"}');

-- --------------------------------------------------------

--
-- Structure de la table `pma__usergroups`
--

CREATE TABLE `pma__usergroups` (
  `usergroup` varchar(64) COLLATE utf8_bin NOT NULL,
  `tab` varchar(64) COLLATE utf8_bin NOT NULL,
  `allowed` enum('Y','N') COLLATE utf8_bin NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User groups with configured menu items';

-- --------------------------------------------------------

--
-- Structure de la table `pma__users`
--

CREATE TABLE `pma__users` (
  `username` varchar(64) COLLATE utf8_bin NOT NULL,
  `usergroup` varchar(64) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Users and their assignments to user groups';

-- --------------------------------------------------------

--
-- Structure de la table `type`
--

CREATE TABLE `type` (
  `id` int(11) NOT NULL,
  `Nom` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `type`
--

INSERT INTO `type` (`id`, `Nom`) VALUES
(1, 'Cassette Audio'),
(2, 'CD'),
(3, 'DVD'),
(4, 'Livre'),
(5, 'VHS'),
(6, 'Vinyle');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_emprunts_actifs`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_emprunts_actifs` (
`ID_Emprunt` int(11)
,`Adherent_Nom` varchar(45)
,`Adherent_Prenom` varchar(45)
,`Titre` varchar(45)
,`Auteur` varchar(45)
,`numero_exemplaire` int(11)
,`Date_Emprunt` date
,`Date_Retour_Prévue` date
,`Statut_Emprunt` enum('rendu','en retard','emprunté')
,`Jours_Retard` int(7)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_media_disponibilite`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_media_disponibilite` (
`id` int(11)
,`Titre` varchar(45)
,`Auteur` varchar(45)
,`Genre` varchar(45)
,`Type` varchar(45)
,`Total_Exemplaires` bigint(21)
,`Exemplaires_Disponibles` decimal(22,0)
,`Exemplaires_Empruntes` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Structure de la vue `v_emprunts_actifs`
--
DROP TABLE IF EXISTS `v_emprunts_actifs`;

CREATE ALGORITHM=UNDEFINED DEFINER=`gutzviln`@`src-a235.univ-savoie.fr` SQL SECURITY DEFINER VIEW `v_emprunts_actifs`  AS SELECT `e`.`ID_Emprunt` AS `ID_Emprunt`, `a`.`Nom` AS `Adherent_Nom`, `a`.`Prenom` AS `Adherent_Prenom`, `m`.`Titre` AS `Titre`, `m`.`Auteur` AS `Auteur`, `ex`.`numero_exemplaire` AS `numero_exemplaire`, `e`.`Date_Emprunt` AS `Date_Emprunt`, `e`.`Date_Retour_Prévue` AS `Date_Retour_Prévue`, `e`.`Statut_Emprunt` AS `Statut_Emprunt`, to_days(curdate()) - to_days(`e`.`Date_Retour_Prévue`) AS `Jours_Retard` FROM (((`emprunt` `e` join `adherent` `a` on(`e`.`adherent_id` = `a`.`id`)) join `exemplaire` `ex` on(`e`.`exemplaire_id` = `ex`.`id`)) join `media` `m` on(`ex`.`media_id` = `m`.`id`)) WHERE `e`.`Statut_Emprunt` in ('emprunté','en retard') ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_media_disponibilite`
--
DROP TABLE IF EXISTS `v_media_disponibilite`;

CREATE ALGORITHM=UNDEFINED DEFINER=`gutzviln`@`src-a235.univ-savoie.fr` SQL SECURITY DEFINER VIEW `v_media_disponibilite`  AS SELECT `m`.`id` AS `id`, `m`.`Titre` AS `Titre`, `m`.`Auteur` AS `Auteur`, `m`.`Genre` AS `Genre`, `t`.`Nom` AS `Type`, count(`ex`.`id`) AS `Total_Exemplaires`, sum(case when `ex`.`disponible` = 1 then 1 else 0 end) AS `Exemplaires_Disponibles`, sum(case when `ex`.`disponible` = 0 then 1 else 0 end) AS `Exemplaires_Empruntes` FROM ((`media` `m` left join `exemplaire` `ex` on(`m`.`id` = `ex`.`media_id`)) left join `type` `t` on(`m`.`type_id` = `t`.`id`)) GROUP BY `m`.`id`, `m`.`Titre`, `m`.`Auteur`, `m`.`Genre`, `t`.`Nom` ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `adherent`
--
ALTER TABLE `adherent`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `emprunt`
--
ALTER TABLE `emprunt`
  ADD PRIMARY KEY (`ID_Emprunt`),
  ADD KEY `fk_emprunt_media1_idx` (`media_id`),
  ADD KEY `fk_emprunt_adherent1_idx` (`adherent_id`),
  ADD KEY `fk_emprunt_exemplaire` (`exemplaire_id`);

--
-- Index pour la table `exemplaire`
--
ALTER TABLE `exemplaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_media_numero` (`media_id`,`numero_exemplaire`);

--
-- Index pour la table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_media_type_idx` (`type_id`);

--
-- Index pour la table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `pma__central_columns`
--
ALTER TABLE `pma__central_columns`
  ADD PRIMARY KEY (`db_name`,`col_name`);

--
-- Index pour la table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `db_name` (`db_name`,`table_name`,`column_name`);

--
-- Index pour la table `pma__designer_settings`
--
ALTER TABLE `pma__designer_settings`
  ADD PRIMARY KEY (`username`);

--
-- Index pour la table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_user_type_template` (`username`,`export_type`,`template_name`);

--
-- Index pour la table `pma__favorite`
--
ALTER TABLE `pma__favorite`
  ADD PRIMARY KEY (`username`);

--
-- Index pour la table `pma__history`
--
ALTER TABLE `pma__history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`,`db`,`table`,`timevalue`);

--
-- Index pour la table `pma__navigationhiding`
--
ALTER TABLE `pma__navigationhiding`
  ADD PRIMARY KEY (`username`,`item_name`,`item_type`,`db_name`,`table_name`);

--
-- Index pour la table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  ADD PRIMARY KEY (`page_nr`),
  ADD KEY `db_name` (`db_name`);

--
-- Index pour la table `pma__recent`
--
ALTER TABLE `pma__recent`
  ADD PRIMARY KEY (`username`);

--
-- Index pour la table `pma__relation`
--
ALTER TABLE `pma__relation`
  ADD PRIMARY KEY (`master_db`,`master_table`,`master_field`),
  ADD KEY `foreign_field` (`foreign_db`,`foreign_table`);

--
-- Index pour la table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_savedsearches_username_dbname` (`username`,`db_name`,`search_name`);

--
-- Index pour la table `pma__table_coords`
--
ALTER TABLE `pma__table_coords`
  ADD PRIMARY KEY (`db_name`,`table_name`,`pdf_page_number`);

--
-- Index pour la table `pma__table_info`
--
ALTER TABLE `pma__table_info`
  ADD PRIMARY KEY (`db_name`,`table_name`);

--
-- Index pour la table `pma__table_uiprefs`
--
ALTER TABLE `pma__table_uiprefs`
  ADD PRIMARY KEY (`username`,`db_name`,`table_name`);

--
-- Index pour la table `pma__tracking`
--
ALTER TABLE `pma__tracking`
  ADD PRIMARY KEY (`db_name`,`table_name`,`version`);

--
-- Index pour la table `pma__userconfig`
--
ALTER TABLE `pma__userconfig`
  ADD PRIMARY KEY (`username`);

--
-- Index pour la table `pma__usergroups`
--
ALTER TABLE `pma__usergroups`
  ADD PRIMARY KEY (`usergroup`,`tab`,`allowed`);

--
-- Index pour la table `pma__users`
--
ALTER TABLE `pma__users`
  ADD PRIMARY KEY (`username`,`usergroup`);

--
-- Index pour la table `type`
--
ALTER TABLE `type`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `adherent`
--
ALTER TABLE `adherent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT pour la table `emprunt`
--
ALTER TABLE `emprunt`
  MODIFY `ID_Emprunt` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT pour la table `exemplaire`
--
ALTER TABLE `exemplaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=257;

--
-- AUTO_INCREMENT pour la table `media`
--
ALTER TABLE `media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT pour la table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pma__history`
--
ALTER TABLE `pma__history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  MODIFY `page_nr` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `type`
--
ALTER TABLE `type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `emprunt`
--
ALTER TABLE `emprunt`
  ADD CONSTRAINT `fk_emprunt_adherent1` FOREIGN KEY (`adherent_id`) REFERENCES `adherent` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_emprunt_exemplaire` FOREIGN KEY (`exemplaire_id`) REFERENCES `exemplaire` (`id`),
  ADD CONSTRAINT `fk_emprunt_media1` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Contraintes pour la table `exemplaire`
--
ALTER TABLE `exemplaire`
  ADD CONSTRAINT `exemplaire_ibfk_1` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `media`
--
ALTER TABLE `media`
  ADD CONSTRAINT `fk_media_type` FOREIGN KEY (`type_id`) REFERENCES `type` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
