import { File } from "@project/io";
import { YamlEntity, YamlModel } from "@project/yaml";

const model = new YamlModel<
  {
    foo: string;
    lorem: {
      ipsum: "dolar";
      sit: string[];
    };
  } & YamlEntity
>({});

// mock file class
jest.mock("../io", () => ({
  File: class File {
    readonly path: string;

    constructor(path: string) {
      this.path = path;
    }

    doesExist() {
      return Promise.resolve(true);
    }

    readAll() {
      return Promise.resolve(
        Buffer.from(
          "foo: bar\nlorem:\n  ipsum: dolar\n  sit:\n    - amet\n",
          "utf-8"
        )
      );
    }

    writeAll() {
      return Promise.resolve();
    }
  },
}));

// mock validator
jest.mock("jsonschema", () => ({
  Validator: jest.fn().mockImplementation(() => ({
    validate: () => {},
  })),
}));

it("opens a yaml file", async () => {
  const spy = jest.spyOn(File.prototype, "writeAll");

  const entity = await model.open("/path/to/file");
  expect(entity.foo).toEqual("bar");
  expect(entity.lorem.ipsum).toEqual("dolar");
  expect(entity.lorem.sit).toHaveLength(1);
  expect(entity.lorem.sit[0]).toEqual("amet");
  await expect(entity.save()).resolves.toBeUndefined();
  expect(spy).toBeCalledTimes(1);
});
