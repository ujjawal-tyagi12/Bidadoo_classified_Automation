export class DuplicateSessionError extends Error {
  constructor(readonly sessionName: string) {
    super(`Session "${sessionName}" already exists. Use dispose("${sessionName}") first or use a different name.`);
    this.name = "DuplicateSessionError";
  }
}

export class SessionNotFoundError extends Error {
  constructor(readonly sessionName: string) {
    super(`Session "${sessionName}" does not exist.`);
    this.name = "SessionNotFoundError";
  }
}

export class SessionNotLaunchedError extends Error {
  constructor(readonly sessionName: string) {
    super(`Session "${sessionName}" has no BrowserContext yet. Call sessions.create(...) or session.launch(...).`);
    this.name = "SessionNotLaunchedError";
  }
}
