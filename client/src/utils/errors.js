export function getErrorMessage(error) {
  if (!error) return "Something went wrong";

  if (error.response?.data) {
    const { message, errors } = error.response.data;
    if (errors?.length) {
      return errors.map((e) => e.message || e.field).join(", ");
    }
    if (message) return message;
  }

  if (error.message === "Network Error") return "Network error — check your connection";
  return error.message || "Something went wrong";
}
