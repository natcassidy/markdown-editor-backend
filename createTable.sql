CREATE TABLE document (
  title varchar(255) DEFAULT NULL,
  content text,
  createDate timestamp NOT NULL DEFAULT (now()),
  documentID SERIAL NOT NULL ,
  ModificationDate timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username varchar(255) DEFAULT NULL,
  PRIMARY KEY (documentID),
  CONSTRAINT document_ibfk_1 FOREIGN KEY (username) REFERENCES user_info (username)
) ;