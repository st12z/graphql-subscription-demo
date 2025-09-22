import { GraphQLScalarType, Kind } from "graphql";

export const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Custom scalar type for Date",
  serialize(value) {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString();
    }
    const parsed = new Date(value);
    return isNaN(parsed) ? null : parsed.toISOString();
  },
  parseValue(value) {
    const date = new Date(value);
    return isNaN(date) ? null : date;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      return isNaN(date) ? null : date;
    }
    return null;
  },
});

