SELECT 'audiobooki' AS table_name, COUNT(*) AS row_count FROM audiobooki;
SELECT 'historia_zamowien' AS table_name, COUNT(*) AS row_count FROM historia_zamowien;
SELECT 'klient' AS table_name, COUNT(*) AS row_count FROM klient;
SELECT 'komiksy' AS table_name, COUNT(*) AS row_count FROM komiksy;
SELECT 'konta' AS table_name, COUNT(*) AS row_count FROM konta;
SELECT 'koszyk' AS table_name, COUNT(*) AS row_count FROM koszyk;
SELECT 'ksiazki' AS table_name, COUNT(*) AS row_count FROM ksiazki;
SELECT 'magazyn' AS table_name, COUNT(*) AS row_count FROM magazyn;
SELECT 'platnosci' AS table_name, COUNT(*) AS row_count FROM platnosci;
SELECT 'zamówienia' AS table_name, COUNT(*) AS row_count FROM zamówienia;


ALTER TABLE audiobooki
    drop CONSTRAINT audiobooki_koszyk_fk;
ALTER TABLE komiksy
    drop CONSTRAINT komiksy_koszyk_fk;  
ALTER TABLE komiksy
    drop CONSTRAINT komiksy_magazyn_fk;    
ALTER TABLE konta
    drop CONSTRAINT konta_historia_zamowien_fk;    
ALTER TABLE konta
    drop CONSTRAINT konta_klient_fk;    
ALTER TABLE koszyk
    drop CONSTRAINT koszyk_zamówienia_fk;    
ALTER TABLE ksiazki
    drop CONSTRAINT ksiazki_koszyk_fk;    
ALTER TABLE ksiazki
    drop CONSTRAINT ksiazki_magazyn_fk;      
ALTER TABLE zamówienia
    drop CONSTRAINT zamówienia_konta_fk;     
ALTER TABLE zamówienia
    drop CONSTRAINT zamówienia_platnosci_fk;  
ALTER TABLE platnosci
    drop CONSTRAINT platnosci_pk;  
DROP TABLE audiobooki;
DROP TABLE historia_zamowien;
DROP TABLE klient;
DROP TABLE komiksy;
DROP TABLE konta;
DROP TABLE koszyk;
DROP TABLE ksiazki;
DROP TABLE magazyn;
DROP TABLE platnosci;
DROP TABLE zamówienia;


CREATE TABLE audiobooki (
    id_audio               INTEGER NOT NULL,
    tytul                  VARCHAR2(100),
    dlugosc                VARCHAR2(10),
    intro                  VARCHAR2(150),
    cena                   FLOAT,
    wydawnictwo            VARCHAR2(40),
    kategoria              VARCHAR2(40),
    kz_id_zamowienia       INTEGER NOT NULL,
    koszyk_id_koszyk       INTEGER NOT NULL,
    kz_konta_id_konta      INTEGER NOT NULL,
    kz_konta_id_historia_z INTEGER NOT NULL
);
CREATE TABLE historia_zamowien (
    id_historia_z     INTEGER NOT NULL,
    historia_zamowien DATE
);
CREATE TABLE klient (
    id_klienta     INTEGER NOT NULL,
    imie           CHAR(20),
    nazwisko       VARCHAR2(20 CHAR),
    adres          CHAR(45),
    numer_telefonu INTEGER
);
CREATE TABLE komiksy (
    id_komiksu             INTEGER NOT NULL,
    tytul                  VARCHAR2(100),
    intro                  VARCHAR2(150),
    cena                   FLOAT,
    liczba_stron           INTEGER,
    ilosc_sztuk            INTEGER,
    wydawnictwo            VARCHAR2(40),
    kategoria              VARCHAR2(40),
    kz_id_zamowienia       INTEGER NOT NULL,
    kz_konta_id_konta      INTEGER NOT NULL,
    kz_konta_id_historia_z INTEGER NOT NULL,
    koszyk_id_koszyk       INTEGER NOT NULL,
    magazyn_id_magazyn     INTEGER NOT NULL
);
CREATE TABLE konta (
    id_konta                INTEGER NOT NULL,
    haslo                   VARCHAR2(25),
    email                   VARCHAR2(35),
    klient_id_klienta       INTEGER NOT NULL,
    historia_zamowien_id_hz INTEGER NOT NULL
);
CREATE TABLE koszyk (
    id_koszyk                      INTEGER NOT NULL,
    zamówienia_id_zamowienia       INTEGER NOT NULL,
    zamówienia_konta_id_konta      INTEGER NOT NULL,
    zamówienia_konta_id_historia_z INTEGER NOT NULL
);
CREATE TABLE ksiazki (
    id_ksiazki             INTEGER NOT NULL,
    tytul                  VARCHAR2(100),
    liczba_stron           INTEGER,
    ilosc_sztuk            INTEGER,
    intro                  VARCHAR2(150),
    cena                   INTEGER,
    wydawnictwo            VARCHAR2(40),
    kategoria              VARCHAR2(40),
    kz_id_zamowienia       INTEGER NOT NULL,
    koszyk_id_koszyk       INTEGER NOT NULL,
    kz_konta_id_konta      INTEGER NOT NULL,
    kz_konta_id_historia_z INTEGER NOT NULL,
    magazyn_id_magazyn     INTEGER NOT NULL
);
CREATE TABLE magazyn (
    id_magazyn               INTEGER NOT NULL,
    adres                    VARCHAR2(30),
    dostepnosc NUMBER NOT NULL
);
CREATE TABLE platnosci (
    id_platnosci                   INTEGER NOT NULL,
    suma                           FLOAT,
    "Data-platnosci"               DATE,
    rodzaj_platnosci               VARCHAR2(25),
    czy_oplacone                   INTEGER,
    zamówienia_id_zamowienia       INTEGER NOT NULL,
    zamówienia_konta_id_konta      INTEGER NOT NULL,
    zamówienia_konta_id_historia_z INTEGER NOT NULL
);
CREATE TABLE zamówienia (
    id_zamowienia          INTEGER NOT NULL,
    platnosci_id_platnosci INTEGER NOT NULL,
    konta_id_konta         INTEGER NOT NULL,
    stan_zamowienia        INTEGER NOT NULL,
    konta_id_historia_z    INTEGER NOT NULL
);

ALTER TABLE audiobooki ADD CONSTRAINT audiobooki_pk PRIMARY KEY ( id_audio);
ALTER TABLE zamówienia ADD CONSTRAINT zamówienia_pk PRIMARY KEY ( id_zamowienia);
ALTER TABLE historia_zamowien ADD CONSTRAINT historia_zamowien_pk PRIMARY KEY ( id_historia_z );
ALTER TABLE klient ADD CONSTRAINT klient_pk PRIMARY KEY ( id_klienta );
ALTER TABLE komiksy ADD CONSTRAINT komiksy_pk PRIMARY KEY ( id_komiksu );
ALTER TABLE konta ADD CONSTRAINT konta_pk PRIMARY KEY ( id_konta );
ALTER TABLE platnosci ADD CONSTRAINT platnosci_pk PRIMARY KEY ( id_platnosci );
ALTER TABLE koszyk ADD CONSTRAINT koszyk_pk PRIMARY KEY ( id_koszyk );
ALTER TABLE ksiazki ADD CONSTRAINT ksiazki_pk PRIMARY KEY ( id_ksiazki );
ALTER TABLE magazyn ADD CONSTRAINT magazyn_pk PRIMARY KEY ( id_magazyn );
ALTER TABLE audiobooki
    ADD CONSTRAINT audiobooki_koszyk_fk FOREIGN KEY ( koszyk_id_koszyk )
        REFERENCES koszyk ( id_koszyk ) ON DELETE SET NULL;
ALTER TABLE komiksy
    ADD CONSTRAINT komiksy_koszyk_fk FOREIGN KEY ( koszyk_id_koszyk )
        REFERENCES koszyk ( id_koszyk ) ON DELETE SET NULL;
ALTER TABLE komiksy
    ADD CONSTRAINT komiksy_magazyn_fk FOREIGN KEY ( magazyn_id_magazyn )
        REFERENCES Magazyn ( ID_Magazyn) ON DELETE SET NULL;  
ALTER TABLE konta
    ADD CONSTRAINT konta_historia_zamowien_fk FOREIGN KEY ( historia_zamowien_id_hz )
        REFERENCES historia_zamowien ( id_historia_z ) ON DELETE SET NULL;
ALTER TABLE konta
    ADD CONSTRAINT konta_klient_fk FOREIGN KEY ( klient_id_klienta )
        REFERENCES klient ( id_klienta ) ON DELETE SET NULL;        
ALTER TABLE koszyk
    ADD CONSTRAINT koszyk_zamówienia_fk FOREIGN KEY ( zamówienia_id_zamowienia )
        REFERENCES zamówienia ( id_zamowienia ) ON DELETE SET NULL;
ALTER TABLE ksiazki
    ADD CONSTRAINT ksiazki_koszyk_fk FOREIGN KEY ( koszyk_id_koszyk )
        REFERENCES koszyk ( id_koszyk ) ON DELETE SET NULL;
ALTER TABLE ksiazki
    ADD CONSTRAINT ksiazki_magazyn_fk FOREIGN KEY ( magazyn_id_magazyn )
        REFERENCES magazyn ( id_magazyn ) ON DELETE SET NULL;     
ALTER TABLE zamówienia
    ADD CONSTRAINT zamówienia_konta_fk FOREIGN KEY ( konta_id_konta )
        REFERENCES konta ( id_konta ) ON DELETE SET NULL;
ALTER TABLE zamówienia
    ADD CONSTRAINT zamówienia_platnosci_fk FOREIGN KEY ( platnosci_id_platnosci )
        REFERENCES platnosci ( id_platnosci ) ON DELETE SET NULL;