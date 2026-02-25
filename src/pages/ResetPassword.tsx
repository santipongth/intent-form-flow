import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    } else {
      // Also listen for auth state change with recovery event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setValid(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("ตั้งรหัสผ่านใหม่ไม่สำเร็จ", { description: error.message });
    } else {
      toast.success("ตั้งรหัสผ่านใหม่สำเร็จ!");
      navigate("/dashboard");
    }
  };

  if (!valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="rounded-2xl w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/auth")}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-2xl mx-auto mb-4">
            🧠
          </div>
          <h1 className="font-display text-2xl font-bold">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-muted-foreground text-sm mt-1">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>รหัสผ่านใหม่</Label>
                <Input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl mt-1"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label>ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl mt-1"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-xl" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
