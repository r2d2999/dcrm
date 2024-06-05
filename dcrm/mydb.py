import mysql.connector



dataBase = mysql.connector.connect(
	host = 'localhost',
	user = 'root',
	password = 'root123'
	)


#prepara el objecto cursor

cursorObject = dataBase.cursor()

#crea la bd
cursorObject.execute("CREATE DATABASE elderco")

print("listo!")