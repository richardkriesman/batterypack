import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

/**
 * A user credential used for authentication to various services.
 */
export type CredentialData =
  | CodeArtifactCredentialData
  | StaticTokenCredentialData; // add any other types to support

/**
 * Use an AWS client profile to authenticate to a CodeArtifact NPM registry.
 */
export interface CodeArtifactCredentialData {
  type: "codeartifact";
  profileName: string;
  domain: string;
  domainOwner: string;
  region: string;
}

/**
 * Connect to an NPM registry using a static token.
 */
export interface StaticTokenCredentialData {
  type: "static-token";
  token: string;
}

@Entity()
export class Credential extends BaseEntity {
  @PrimaryColumn()
  name: string;

  @Column("simple-json")
  data: CredentialData;
}
