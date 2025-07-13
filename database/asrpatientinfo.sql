-- phpMyAdmin SQL Dump
-- version 5.0.2
-- Full database with consent, pointers, and relationships
-- Generation Time: CURRENT

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `hospitaldb`;
USE `hospitaldb`;

-- Table: doctor
CREATE TABLE `doctor` (
  `doctorID` INT NOT NULL AUTO_INCREMENT,
  `doctorName` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`doctorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: patient
CREATE TABLE `patient` (
  `patientID` INT NOT NULL AUTO_INCREMENT,
  `patientName` VARCHAR(100) NOT NULL,
  `doctorID` INT NOT NULL,
  `age` INT NOT NULL,
  `maritalStatus` ENUM('Single', 'Married', 'Divorced', 'Widowed') NOT NULL,
  `education` VARCHAR(100) NOT NULL,
  `occupation` VARCHAR(100) NOT NULL,
  `monthlyIncome` INT NOT NULL,
  PRIMARY KEY (`patientID`),
  FOREIGN KEY (`doctorID`) REFERENCES `doctor`(`doctorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: patientConsent
CREATE TABLE `patientConsent` (
  `patientID` INT NOT NULL,
  `consentGiven` ENUM('Yes', 'No') DEFAULT NULL,
  PRIMARY KEY (`patientID`),
  FOREIGN KEY (`patientID`) REFERENCES `patient`(`patientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: stpointer (e.g., for keeping track of patient processing)
CREATE TABLE `stpointer` (
  `currentPointer` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert dummy pointer
INSERT INTO `stpointer` (`currentPointer`) VALUES (1);

-- Insert dummy doctors
INSERT INTO `doctor` (`doctorName`) VALUES
('Dr. Arjun Rao'),
('Dr. Meena Patil');

-- Insert dummy patients
INSERT INTO `patient` (`patientName`, `doctorID`, `age`, `maritalStatus`, `education`, `occupation`, `monthlyIncome`) VALUES
('Ravi Kumar', 1, 35, 'Married', 'Graduate', 'Engineer', 50000),
('Anita Desai', 2, 28, 'Single', 'Postgraduate', 'Teacher', 40000);

-- Insert dummy consent
INSERT INTO `patientConsent` (`patientID`, `consentGiven`) VALUES
(1, 'Yes'),
(2, 'No');

COMMIT;
