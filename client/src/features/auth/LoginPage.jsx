import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Monitor, Coffee } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { usePageEnter } from "../../hooks/useGsapAnimation";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Card } from "../../components/common/Card";

const schema = Joi.object({
  email: Joi.string().email().required().messages({ "string.email": "Valid email required" }),
  password: Joi.string().required(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const panelRef = usePageEnter([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: joiResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await authApi.login(data);
      login(result);
      toast.success("Welcome back!");
      navigate(result.user.role === "admin" ? "/admin/reports" : "/pos");
    } catch (err) {
      toast.error(err.userMessage || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-brand-espresso p-12 text-bg-elevated lg:flex">
        <div className="flex items-center gap-3">
          <Coffee size={28} strokeWidth={1.75} />
          <span className="font-display text-2xl">Odoo Cafe</span>
        </div>
        <div>
          <h1 className="font-display text-4xl leading-tight">Run your cafe with clarity.</h1>
          <p className="mt-4 max-w-md text-bg-elevated/75">
            Point of sale, kitchen display, and back office — one cohesive system for your team.
          </p>
        </div>
        <p className="text-sm text-bg-elevated/50">© Odoo Cafe POS</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-bg-base p-6">
        <div ref={panelRef} className="w-full max-w-md">
        <Card className="w-full" padding="lg">
          <h2 className="font-display text-2xl text-brand-espresso">Sign in</h2>
          <p className="mt-1 text-sm text-text-muted">Access your POS terminal or admin panel</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            New cafe?{" "}
            <Link to="/signup" className="font-semibold text-accent-primary hover:underline">
              Create account
            </Link>
          </p>

          <Link
            to="/kds/setup"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border-subtle py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-sunken"
          >
            <Monitor size={16} strokeWidth={1.75} /> Kitchen display setup
          </Link>
        </Card>
        </div>
      </div>
    </div>
  );
}
