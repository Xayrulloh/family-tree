export type JwtPayloadType = {
  sub: string;
  email: string;
};

export type GoogleProfileType = {
  id: string;
  name: { givenName: string; familyName: string };
  emails: { value: string; type: string }[];
  photos: { value: string; type: string }[];
};
