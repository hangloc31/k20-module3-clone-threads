import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải ≥ 8 ký tự"),
  name: z.string().nonempty("Họ tên không được trống"),
});

const formData = {
  email: "ttv@gmail.com",
  password: "12345678",
  name: "Tran Vy",
};

const ZodComponent = () => {
  const parsedData = registerSchema.parse(formData);
  console.log(parsedData);
  return <div>ZodComponent</div>;
};

export default ZodComponent;
