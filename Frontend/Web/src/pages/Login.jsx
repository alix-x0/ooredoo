import { useState, useMemo, useEffect } from "react";
import api from "@/api/api";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_ROLE } from "@/constants";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import giftsImage from "@/assets/gifts.jpg";
import hrImage from "@/assets/HR.jpg";
import warehouseImage from "@/assets/warehouse.jpg";
import ooredooLogo from "@/assets/Logo.svg";
import Threads from "@/components/ui/Threads";
import ForgotPasswordModal from "@/pages/ForgotPassword";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/ui/custom-toast";
import { useTheme } from "@/components/theme-provider";

const font = "'Rubik', 'Poppins', sans-serif";

const slides = [
    {
        image: giftsImage,
        alt: "Gifts",
        quote: "Our rewards and gifts portal simplifies employee appreciation. Recognizing outstanding work has never been so seamless and motivating.",
        author: "Sarah Connor",
        role: "Rewards Manager",
        company: "Global Engagement Corp"
    },
    {
        image: hrImage,
        alt: "Human Resources",
        quote: "Managing recruitment, onboarding, and employee development is effortless with our unified HR solution. It brings teams closer together.",
        author: "Marcus Aurelius",
        role: "Head of HR",
        company: "People & Culture Group"
    },
    {
        image: warehouseImage,
        alt: "Warehouse",
        quote: "Track inventory, streamline distribution, and run logistics in real-time. The ultimate tool for modern supply chain management.",
        author: "Liam Smith",
        role: "Logistics Director",
        company: "Global Supply Solutions"
    }
];

function Login() {
    const { t } = useLanguage();
    const toast = useToast();
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [currentSlide]);

    const memoizedThreads = useMemo(() => (
        <Threads
            color={isDark ? [0.95, 0.15, 0.15] : [0.95, 0.05, 0.05]}
            amplitude={0.8}
            distance={0.1}
            enableMouseInteraction
        />
    ), [isDark]);

    const handleLogin = async () => {
        let EmptyErrors = {};
        if (!email.trim()) EmptyErrors.email = "Email is required";
        if (!password) EmptyErrors.password = "Password is required";
        if (Object.keys(EmptyErrors).length > 0) { setErrors(EmptyErrors); return; }
        setErrors({});
        setLoading(true);
        try {
            const res = await api.post("/auth/login/", { username: email, email, password });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            // Decode JWT payload to extract the role
            try {
                const payload = JSON.parse(atob(res.data.access.split(".")[1]));
                if (payload.role) localStorage.setItem(USER_ROLE, payload.role);
            } catch (_) { /* ignore decode errors */ }
            navigate("/dashboard");
        } catch (error) {
            toast.error("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleLogin();
    };

    // Theme Colors mapping
    const themeBg = isDark ? "#09090b" : "#ffffff";
    const themeCardBg = isDark ? "#121214" : "#ffffff";
    const themeCardBorder = isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0,0,0,0.04)";
    const themeCardShadow = isDark
        ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)"
        : "0 8px 32px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.01)";

    const themeTextColor = isDark ? "#ffffff" : "#1c1c1e";
    const themeHeadingColor = isDark ? "#ffffff" : "#000000";
    const themeSubtextColor = isDark ? "#a1a1aa" : "#6b6b70";
    const themeLabelColor = isDark ? "#d4d4d8" : "#1c1c1e";

    const themeInputBg = isDark ? "#1c1c1e" : "#ffffff";
    const themeInputBorder = isDark ? "1px solid #2d2d30" : "1px solid #e5e5ea";
    const themeInputFocusBorder = "#ed1c24";

    const themeToggleBg = isDark ? "#1c1c1e" : "#f8f8fa";
    const themeToggleBorder = isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.03)";
    const themeToggleActiveBg = isDark ? "#2c2c2e" : "#ffffff";
    const themeToggleActiveBorder = isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.04)";
    const themeToggleActiveShadow = isDark ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(0,0,0,0.04)";

    const themeDividerLine = isDark ? "#27272a" : "#f2f2f7";
    const themeDividerText = isDark ? "#71717a" : "#aeaeb2";

    const themeSocialBtnBg = isDark ? "#1c1c1e" : "#ffffff";
    const themeSocialBtnBorder = isDark ? "1px solid #2d2d30" : "1px solid #e5e5ea";
    const themeSocialBtnHoverBg = isDark ? "#242427" : "#fafafa";
    const themeSocialBtnHoverBorder = isDark ? "#3f3f46" : "#c7c7cc";

    const themeBottomLinkColor = "#ed1c24"; // red accent
    const themeForgotPwColor = isDark ? "#a1a1aa" : "#3a3a3c";

    return (
        <div style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            fontFamily: font,
            background: themeBg,
            position: "relative",
            overflow: "hidden",
            letterSpacing: "-0.2px",
            transition: "background 0.5s ease",
        }}>
            {/* ─── Background Threads ─── */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: isDark ? 0.3 : 0.4 }}>
                {memoizedThreads}
            </div>

            {/* ─── Floating Theme Toggle at Top Right ─── */}
            <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                    position: "absolute",
                    top: 24,
                    right: 24,
                    zIndex: 10,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
                    background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.6)",
                    color: isDark ? "#ffffff" : "#1c1c1e",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.6)";
                }}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* ── Main Card ── */}
            <div className="login-card" style={{
                width: "100%",
                maxWidth: 1040,
                background: themeCardBg,
                borderRadius: 20,
                display: "flex",
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
                boxShadow: themeCardShadow,
                minHeight: 460,
                border: themeCardBorder,
                transition: "min-height 0.6s cubic-bezier(0.25, 1, 0.5, 1), background 0.5s ease, border 0.5s ease, box-shadow 0.5s ease",
            }}>

                {/* ═══════ LEFT — Login Form ═══════ */}
                <div className="login-form-side" style={{
                    width: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "40px 0 32px",
                    boxSizing: "border-box",
                }}>
                    <div style={{
                        width: "100%",
                        maxWidth: 275,
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                    }}>

                        {/* Forms Container */}
                        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>

                            {/* ──── LOGIN FORM VIEW ──── */}
                            <div style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                justifyContent: "space-between",
                                opacity: 1,
                                visibility: "visible",
                                transition: "opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.4s",
                                position: "relative",
                                pointerEvents: "auto",
                                top: 0, left: 0, right: 0,
                            }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {/* Heading */}
                                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                                        {/* Ooredoo Brand Logo */}
                                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                                            <img src={ooredooLogo} alt="Ooredoo" style={{ height: 32, display: "block" }} />
                                        </div>
                                        <h1 style={{
                                            fontSize: 19,
                                            fontWeight: 600,
                                            color: themeHeadingColor,
                                            margin: "0 0 4px",
                                            letterSpacing: "-0.5px",
                                            fontFamily: font,
                                        }}>
                                            {t("letsJoinUs") === "Let's join with us" || t("letsJoinUs") === "Rejoignez-nous" ? "Wellcome!" : t("letsJoinUs")}
                                        </h1>
                                        <p style={{
                                            fontSize: 11,
                                            color: themeSubtextColor,
                                            margin: 0,
                                            fontWeight: 400,
                                            fontFamily: font,
                                        }}>
                                            {t("signInJoin") === "You can sign in or join with us if you're new to InterShip." || t("signInJoin") === "Vous pouvez vous connecter ou nous rejoindre si vous êtes nouveau sur InterShip." ? "Please enter your details to login." : t("signInJoin")}
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                                        {/* Email */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{
                                                display: "block", fontSize: 11, fontWeight: 500,
                                                color: themeLabelColor, marginBottom: 6, fontFamily: font,
                                            }}>{t("email") === "Email" || t("email") === "E-mail" ? "Email address" : t("email")}</label>
                                            <input
                                                type="text"
                                                placeholder={t("enterEmail") === "Enter your email" || t("enterEmail") === "Entrez votre e-mail" ? "Enter your email address" : t("enterEmail")}
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })) }}
                                                style={{
                                                    width: "100%", height: 36, padding: "0 12px",
                                                    borderRadius: 8, border: errors.email ? "1px solid #ff3b30" : themeInputBorder,
                                                    background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                    outline: "none", fontFamily: font, boxSizing: "border-box",
                                                    transition: "border-color 0.15s, box-shadow 0.15s",
                                                }}
                                                onFocus={e => { if (!errors.email) { e.target.style.borderColor = themeInputFocusBorder; e.target.style.boxShadow = "0 0 0 2px rgba(237, 28, 36, 0.08)" } }}
                                                onBlur={e => { if (!errors.email) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea"; e.target.style.boxShadow = "none" } }}
                                            />
                                            {errors.email && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 4, marginLeft: 2 }}>{errors.email}</p>}
                                        </div>

                                        {/* Password */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <label style={{
                                                    fontSize: 11, fontWeight: 500, color: themeLabelColor, fontFamily: font,
                                                }}>{t("password")}</label>
                                                <button type="button" onClick={() => setIsForgotModalOpen(true)}
                                                    style={{
                                                        background: "none", border: "none", fontSize: 10,
                                                        fontWeight: 600, color: themeForgotPwColor, cursor: "pointer",
                                                        fontFamily: font, padding: 0, textDecoration: "none",
                                                    }}
                                                    onMouseEnter={e => e.target.style.textDecoration = "underline"}
                                                    onMouseLeave={e => e.target.style.textDecoration = "none"}
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t("enterPassword") || "Enter your password"}
                                                    value={password}
                                                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null })) }}
                                                    style={{
                                                        width: "100%", height: 36, padding: "0 34px 0 12px",
                                                        borderRadius: 8, border: errors.password ? "1px solid #ff3b30" : themeInputBorder,
                                                        background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                        outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        transition: "border-color 0.15s, box-shadow 0.15s",
                                                    }}
                                                    onFocus={e => { if (!errors.password) { e.target.style.borderColor = themeInputFocusBorder; e.target.style.boxShadow = "0 0 0 2px rgba(237, 28, 36, 0.08)" } }}
                                                    onBlur={e => { if (!errors.password) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea"; e.target.style.boxShadow = "none" } }}
                                                />
                                                <button type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        position: "absolute", right: 10, top: "50%",
                                                        transform: "translateY(-50%)", background: "none",
                                                        border: "none", cursor: "pointer", color: "#8e8e93",
                                                        padding: 0, display: "flex", alignItems: "center",
                                                        transition: "color 0.2s",
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = themeTextColor}
                                                    onMouseLeave={e => e.currentTarget.style.color = "#8e8e93"}
                                                >
                                                    {showPassword ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 10c4 6 12 6 16 0" />
                                                            <line x1="12" y1="14" x2="12" y2="18" />
                                                            <line x1="7" y1="12.5" x2="5" y2="15.5" />
                                                            <line x1="17" y1="12.5" x2="19" y2="15.5" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            {errors.password && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 4, marginLeft: 2 }}>{errors.password}</p>}
                                        </div>

                                        {/* Log In Button */}
                                        <button type="submit" disabled={loading}
                                            style={{
                                                width: "100%", height: 38,
                                                background: "#ed1c24",
                                                color: "#ffffff",
                                                border: "1px solid #ed1c24",
                                                borderRadius: 9999,
                                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
                                                fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                                                fontFamily: font, letterSpacing: "0.2px",
                                                WebkitFontSmoothing: "antialiased",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                                transition: "all 0.2s ease",
                                                opacity: loading ? 0.7 : 1,
                                            }}
                                            onMouseEnter={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = "#d1131a";
                                                    e.currentTarget.style.borderColor = "#d1131a";
                                                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.12)";
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = "#ed1c24";
                                                    e.currentTarget.style.borderColor = "#ed1c24";
                                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.08)";
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />{t("loggingIn")}</>
                                            ) : "Log In"}
                                        </button>
                                    </form>

                                    {/* OR Divider */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
                                        <div style={{ flex: 1, height: 1, background: themeDividerLine }} />
                                        <span style={{ fontSize: 9.5, color: themeDividerText, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>OR</span>
                                        <div style={{ flex: 1, height: 1, background: themeDividerLine }} />
                                    </div>

                                    {/* Social Buttons */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {[
                                            {
                                                icon: (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                                    </svg>
                                                ),
                                                label: "Continue with Google"
                                            },
                                            {
                                                icon: (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isDark ? "#ffffff" : "#1c1c1e"} style={{ marginRight: 8 }}>
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                                    </svg>
                                                ),
                                                label: "Continue with GitHub"
                                            }
                                        ].map((s, i) => (
                                            <button key={i} type="button"
                                                style={{
                                                    width: "100%", height: 32,
                                                    border: themeSocialBtnBorder, borderRadius: 6,
                                                    background: themeSocialBtnBg,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 11.5, fontWeight: 500, color: themeTextColor,
                                                    cursor: "pointer", fontFamily: font,
                                                    transition: "border-color 0.15s, background-color 0.15s",
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = themeSocialBtnHoverBorder; e.currentTarget.style.backgroundColor = themeSocialBtnHoverBg }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = themeSocialBtnBorder; e.currentTarget.style.backgroundColor = themeSocialBtnBg }}
                                            >
                                                {s.icon}
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════ RIGHT — Image + Testimonial ═══════ */}
                <div className="login-image-side" style={{
                    width: "50%", position: "relative", overflow: "hidden",
                    margin: 10, borderRadius: 16,
                }}>
                    {/* Sliding Images */}
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: currentSlide === index ? 1 : 0,
                                transition: "opacity 1s ease-in-out",
                                zIndex: currentSlide === index ? 1 : 0,
                            }}
                        >
                            <img
                                src={slide.image}
                                alt={slide.alt}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </div>
                    ))}

                    {/* Ambient overlay */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                        zIndex: 2,
                    }} />

                    {/* Testimonial Glass Card */}
                    <div style={{
                        position: "absolute", bottom: 20, left: 20, right: 20,
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                        borderRadius: 16, padding: "12px 16px 12px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                        zIndex: 3,
                    }}>
                        {/* Quotes Slides Container */}
                        <div style={{ position: "relative" }}>
                            {slides.map((slide, index) => (
                                <div
                                    key={index}
                                    style={{
                                        opacity: currentSlide === index ? 1 : 0,
                                        visibility: currentSlide === index ? "visible" : "hidden",
                                        transition: "opacity 0.6s ease-in-out, visibility 0.6s",
                                        position: index === 0 ? "relative" : "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        pointerEvents: currentSlide === index ? "auto" : "none",
                                    }}
                                >
                                    <p style={{
                                        fontSize: 12, color: "#ffffff", lineHeight: 1.35,
                                        fontWeight: 400, margin: "0 0 12px 0", fontFamily: font, letterSpacing: "-0.1px",
                                        opacity: 0.95,
                                    }}>
                                        &ldquo;{slide.quote}&rdquo;
                                    </p>
                                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0, fontFamily: font }}>{slide.author}</p>
                                            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#ffffff", opacity: 0.85, margin: "2px 0 0", fontFamily: font }}>{slide.role}</p>
                                            <p style={{ fontSize: 9.5, fontWeight: 400, color: "#ffffff", opacity: 0.55, margin: "2px 0 0", fontFamily: font }}>{slide.company}</p>
                                        </div>
                                        {/* Reserve space for controls */}
                                        <div style={{ width: 110, height: 24 }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Navigation Panel */}
                        <div style={{
                            position: "absolute",
                            bottom: 12,
                            right: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            zIndex: 4,
                        }}>
                            {/* Dot Indicators */}
                            <div style={{ display: "flex", gap: 6 }}>
                                {slides.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCurrentSlide(i)}
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            border: "none",
                                            padding: 0,
                                            background: currentSlide === i ? "#ed1c24" : "rgba(255, 255, 255, 0.4)",
                                            boxShadow: currentSlide === i ? "0 0 8px rgba(237, 28, 36, 0.8)" : "none",
                                            cursor: "pointer",
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            transform: currentSlide === i ? "scale(1.3)" : "scale(1)",
                                        }}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Navigation Arrows */}
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        opacity: 0.75,
                                        transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = "1" }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = "0.75" }}
                                >
                                    <ArrowLeft size={16} color="#ffffff" strokeWidth={1.75} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        opacity: 0.75,
                                        transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = "1" }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = "0.75" }}
                                >
                                    <ArrowRight size={16} color="#ffffff" strokeWidth={1.75} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap');

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input::placeholder { color: #8e8e93; opacity: 0.7; font-weight: 400; }
                
                /* Override browser autofill light-blue background to keep it pure white */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px white inset !important;
                    -webkit-text-fill-color: #1c1c1e !important;
                    transition: background-color 5000s ease-in-out 0s;
                }



                @media (max-width: 900px) {
                    .login-card {
                        flex-direction: column !important;
                        min-height: auto !important;
                        max-width: 500px !important;
                    }
                    .login-form-side {
                        width: 100% !important;
                        padding: 40px 24px !important;
                    }
                    .login-image-side {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default Login;
