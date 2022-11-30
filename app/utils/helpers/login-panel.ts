export function validateUsername(username: unknown) {
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length >= 25
  ) {
    return `Usernames must be at least 3 and max. 25 characters long`;
  }
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

export function validateUrl(url: any) {
  let urls = ["/game", "/"];
  if (urls.includes(url)) {
    return url;
  }
  return "/game";
}
