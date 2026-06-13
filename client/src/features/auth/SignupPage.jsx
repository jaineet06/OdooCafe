import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Coffee } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { usePageEnter } from "../../hooks/useGsapAnimation";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Card } from "../../components/common/Card";

const schema = Joi.object({
  tenantName: Joi.string().min(2).max(255).required(),
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const panelRef = usePageEnter([]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: joiResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await authApi.signup(data);
      signup({ token: result.token, user: result.user });
      toast.success("Account created!");
      navigate("/pos");
    } catch (err) {
      toast.error(err.userMessage || "Signup failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-center bg-brand-espresso p-12 text-bg-elevated lg:flex">
        <Coffee size={32} className="mb-6" strokeWidth={1.75} />
        <h1 className="font-display text-4xl">Start your cafe journey</h1>
        <p className="mt-4 max-w-sm text-bg-elevated/75">Set up your tenant, menu, and team in minutes.</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-bg-base p-6">
        <div ref={panelRef} className="w-full max-w-md">
          <Card padding="lg">
            <h2 className="font-display text-2xl text-brand-espresso">Create account</h2>
            <p className="mt-1 text-sm text-text-muted">Your cafe name and admin credentials</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <Input label="Cafe / restaurant name" error={errors.tenantName?.message} {...register("tenantName")} />
              <Input label="Your name" error={errors.name?.message} {...register("name")} />
              <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
              <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Create account</Button>
            </form>
            <p className="mt-6 text-center text-sm text-text-muted">
              Already have an account? <Link to="/login" className="font-semibold text-accent-primary hover:underline">Sign in</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
