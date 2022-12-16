import { it, expect } from "vitest";
import { validateUsername } from "./utils";
import { faker } from "@faker-js/faker";

it("should return an error message when less than 3 characters are entered", () => {
  const tooShortPassword = faker.internet.password(2);
  const errorMessage = validateUsername(tooShortPassword);

  expect(errorMessage).toBeTypeOf("string");
});

it("should return an error message when more than 25 characters have been entered", () => {
  const tooLongPassword = faker.internet.password(26);
  const errorMessage = validateUsername(tooLongPassword);

  expect(errorMessage).toBeTypeOf("string");
});
