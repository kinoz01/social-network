export async function createPost(formData: FormData) {
  const title = formData.get("title");
  const content = formData.get("content");
  console.log(title, content);

}
