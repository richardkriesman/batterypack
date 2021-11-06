import { BaseEntity, Entity, PrimaryGeneratedColumn, Tree } from "typeorm";

@Entity()
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn({
    unsigned: true,
  })
  id: number;

  subprojects: Project[];
}
