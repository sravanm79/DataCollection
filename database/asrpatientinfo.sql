-- phpMyAdmin SQL Dump
-- version 5.0.2
-- Updated with additional optional fields: height, weight, identification marks, injuries

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
  `patientID` VARCHAR(50) NOT NULL,
  `patientName` VARCHAR(100) NOT NULL,
  `doctorID` INT NOT NULL,
  `age` INT NOT NULL,
  `maritalStatus` ENUM('Single', 'Married', 'Divorced', 'Widowed') NOT NULL,
  `education` VARCHAR(100),
  `occupation` VARCHAR(100),
  `monthlyIncome` INT,

  -- New optional fields
  `height` VARCHAR(10),
  `weight` VARCHAR(10),
  `identificationMarks` TEXT,
  `injuries` TEXT,

  PRIMARY KEY (`patientID`),
  FOREIGN KEY (`doctorID`) REFERENCES `doctor`(`doctorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: patientConsent  
CREATE TABLE `patientConsent` (
  `patientID` VARCHAR(50) NOT NULL,
  `consentGiven` ENUM('Yes', 'No') DEFAULT NULL,
  PRIMARY KEY (`patientID`),
  FOREIGN KEY (`patientID`) REFERENCES `patient`(`patientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: patientAudio
CREATE TABLE `patientAudio` (
  `audioID` INT NOT NULL AUTO_INCREMENT,
  `patientID` VARCHAR(50) NOT NULL,
  `recordingDate` DATETIME NOT NULL,
  `audioFile` LONGBLOB NOT NULL,
  PRIMARY KEY (`audioID`),
  FOREIGN KEY (`patientID`) REFERENCES `patient`(`patientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `doctor` (`doctorName`) VALUES
('Dr. Arjun Rao'),
('Dr. Meena Patil');

INSERT INTO `patient` (
  `patientID`, `patientName`, `doctorID`, `age`, `maritalStatus`, `education`, `occupation`, `monthlyIncome`,
  `height`, `weight`, `identificationMarks`, `injuries`
) VALUES
('P001', 'Ravi Kumar', 1, 35, 'Married', 'Graduate', 'Engineer', 50000, '170 cm', '70 kg', 'Mole on left cheek', ''),
('P002', 'Anita Desai', 2, 28, 'Single', 'Postgraduate', 'Teacher', 40000, '160 cm', '55 kg', '', 'Fractured arm (healed)');

INSERT INTO `patientConsent` (`patientID`, `consentGiven`) VALUES
('P001', 'Yes'),
('P002', 'No');

COMMIT;
