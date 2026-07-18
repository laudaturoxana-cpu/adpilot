/** Erori de autorizare cu status HTTP asociat. Modul standalone (fără alte
 *  importuri) ca să poată fi importat atât de guards, cât și de handler-ul API
 *  fără cicluri. */

export class UnauthenticatedError extends Error {
  status = 401 as const;
  constructor(message = "Neautentificat") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Nu ai permisiunea necesară pentru această acțiune") {
    super(message);
    this.name = "ForbiddenError";
  }
}
