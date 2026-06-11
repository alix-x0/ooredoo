import { useState, useMemo, useEffect } from "react";
import api from "@/api/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import premiumPhoto from "@/assets/login_page_image.jpg";
import Threads from "@/components/ui/Threads";
import ForgotPasswordModal from "@/pages/ForgotPassword";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/ui/custom-toast";
import { useTheme } from "@/components/theme-provider";

const font = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const universities = [
    "USTHB (Houari Boumediene University of Science and Technology)",
    "ESI Algiers (National Higher School of Computer Science)",
    "University of Algiers 1 (Benyoucef Benkhedda)",
    "University of Science and Technology of Oran (USTO)",
    "University of Constantine 1 (Mentouri)",
    "University of Bejaia (Abderrahmane Mira)",
    "University of Tizi Ouzou (Mouloud Mammeri)",
    "University of Boumerdes (M'hamed Bougara)"
];

const departments = [
    "Computer Science",
    "Artificial Intelligence",
    "Software Engineering",
    "Data Science",
    "Cyber Security",
    "Information Technology",
    "Computer Systems & Networks"
];


function Login() {
    const { t } = useLanguage();
    const toast = useToast();
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    // Auth mode detection
    const location = useLocation();
    const isRegister = location.pathname === "/register";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    
    // Registration-specific fields
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [university, setUniversity] = useState("");
    const [major, setMajor] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState("STUDENT");

    const navigate = useNavigate();

    // Clear password and errors on mode switch
    useEffect(() => {
        setErrors({});
        setPassword("");
        setConfirmPassword("");
        setUniversity("");
        setMajor("");
        setRegistrationNumber("");
    }, [isRegister]);
    
    const memoizedThreads = useMemo(() => (
        <Threads
            color={isDark ? [0.4, 0.6, 0.9] : [0.06, 0.27, 0.54]}
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
            navigate("/");
        } catch (error) {
            toast.error("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        let EmptyErrors = {};
        if (role === "STUDENT") {
            if (!firstName.trim()) EmptyErrors.firstName = "First name is required";
            if (!lastName.trim()) EmptyErrors.lastName = "Last name is required";
            if (!university) EmptyErrors.university = "University is required";
            if (!major) EmptyErrors.major = "Department is required";
        } else {
            if (!username.trim()) EmptyErrors.username = "Username is required";
        }
        if (!email.trim()) {
            EmptyErrors.email = "Email is required";
        } else if (role === "STUDENT" && !email.toLowerCase().endsWith("@univ.dz")) {
            EmptyErrors.email = "Student email must end with @univ.dz";
        }
        if (!password) EmptyErrors.password = "Password is required";
        if (!confirmPassword) {
            EmptyErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            EmptyErrors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(EmptyErrors).length > 0) {
            setErrors(EmptyErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            const payload = {
                email,
                password,
                role,
                ...(role === "STUDENT"
                    ? { first_name: firstName, last_name: lastName, university_id: university, major }
                    : { username, name: username })
            };
            await api.post("/auth/register/", payload);
            toast.success("Account created successfully! You can now log in.");
            navigate("/login");
        } catch (error) {
            if (error.response && error.response.data) {
                const backendErrors = error.response.data;
                const newErrors = {};
                for (const key in backendErrors) {
                    newErrors[key] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
                }
                setErrors(newErrors);
            } else {
                toast.error("Registration failed. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRegister) {
            await handleRegister();
        } else {
            await handleLogin();
        }
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
    const themeInputFocusBorder = isDark ? "#52525b" : "#8e8e93";

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

    const themeBottomLinkColor = isDark ? "#3b82f6" : "#1a3a6b"; // blue accent
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
                maxWidth: 1040, // Reduced from 1140 for a more compact card
                background: themeCardBg,
                borderRadius: 20, // Slightly softer border radius
                display: "flex",
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
                boxShadow: themeCardShadow,
                minHeight: isRegister ? (role === "STUDENT" ? 640 : 580) : 460, // Dynamic height depending on mode and role
                border: themeCardBorder,
                transition: "min-height 0.6s cubic-bezier(0.25, 1, 0.5, 1), background 0.5s ease, border 0.5s ease, box-shadow 0.5s ease",
            }}>
                {/* Floating back chevron inside the container */}
                <Link to="/" style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isDark ? "rgba(28, 28, 30, 0.75)" : "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(6px)",
                    color: isDark ? "#ffffff" : "#1c1c1e",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.08)",
                    opacity: 0.65,
                    transition: "all 0.25s ease",
                    zIndex: 10,
                    cursor: "pointer",
                    boxShadow: isDark ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.background = isDark ? "#1c1c1e" : "#ffffff";
                    e.currentTarget.style.boxShadow = isDark ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.08)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.opacity = 0.65;
                    e.currentTarget.style.background = isDark ? "rgba(28, 28, 30, 0.75)" : "rgba(255, 255, 255, 0.75)";
                    e.currentTarget.style.boxShadow = isDark ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.04)";
                }}
                >
                    <ArrowLeft size={13} strokeWidth={2.5} />
                </Link>
                {/* ═══════ LEFT — Login Form ═══════ */}
                <div className={`login-form-side ${isRegister ? "register-mode" : ""}`} style={{
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
                        {/* Shared Tab Toggle */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            padding: "2px",
                            background: themeToggleBg,
                            borderRadius: 5,
                            width: "fit-content",
                            margin: "0 auto 16px",
                            border: themeToggleBorder,
                        }}>
                            <Link to="/login" style={{ textDecoration: "none" }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: !isRegister ? themeToggleActiveBg : "transparent",
                                    fontSize: 9.5,
                                    fontWeight: !isRegister ? 600 : 500,
                                    color: !isRegister ? themeTextColor : "#8e8e93",
                                    boxShadow: !isRegister ? themeToggleActiveShadow : "none",
                                    border: !isRegister ? themeToggleActiveBorder : "1px solid transparent",
                                    cursor: !isRegister ? "default" : "pointer",
                                    transition: "all 0.2s",
                                }}>
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    {t("login")}
                                </div>
                            </Link>
                            <Link to="/register" style={{ textDecoration: "none" }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: isRegister ? themeToggleActiveBg : "transparent",
                                    fontSize: 9.5,
                                    fontWeight: isRegister ? 600 : 500,
                                    color: isRegister ? themeTextColor : "#8e8e93",
                                    boxShadow: isRegister ? themeToggleActiveShadow : "none",
                                    border: isRegister ? themeToggleActiveBorder : "1px solid transparent",
                                    cursor: isRegister ? "default" : "pointer",
                                    transition: "all 0.2s",
                                }}>
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    {t("signUp")}
                                </div>
                            </Link>
                        </div>

                        {/* Forms Container */}
                        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                            
                            {/* ──── LOGIN FORM VIEW ──── */}
                            <div style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                justifyContent: "space-between",
                                opacity: isRegister ? 0 : 1,
                                visibility: isRegister ? "hidden" : "visible",
                                transition: "opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.4s",
                                position: isRegister ? "absolute" : "relative",
                                pointerEvents: isRegister ? "none" : "auto",
                                top: 0, left: 0, right: 0,
                            }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {/* Heading */}
                                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                                        <h1 style={{
                                            fontSize: 20,
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
                                                    width: "100%", height: 32, padding: "0 10px",
                                                    borderRadius: 6, border: errors.email ? "1px solid #ff3b30" : themeInputBorder,
                                                    background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                    outline: "none", fontFamily: font, boxSizing: "border-box",
                                                    transition: "border-color 0.15s",
                                                }}
                                                onFocus={e => { if (!errors.email) { e.target.style.borderColor = themeInputFocusBorder } }}
                                                onBlur={e => { if (!errors.email) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea" } }}
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
                                                        width: "100%", height: 32, padding: "0 34px 0 10px",
                                                        borderRadius: 6, border: errors.password ? "1px solid #ff3b30" : themeInputBorder,
                                                        background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                        outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        transition: "border-color 0.15s",
                                                    }}
                                                    onFocus={e => { if (!errors.password) { e.target.style.borderColor = themeInputFocusBorder } }}
                                                    onBlur={e => { if (!errors.password) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea" } }}
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
                                                width: "100%", height: 34,
                                                background: isDark ? "linear-gradient(180deg, #3a3f50 0%, #1c202b 100%)" : "linear-gradient(180deg, #222733 0%, #12151c 100%)",
                                                color: "#ffffff",
                                                border: isDark ? "1px solid #1c202b" : "1px solid #0d1015",
                                                borderRadius: 6,
                                                boxShadow: isDark 
                                                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 5px rgba(0, 0, 0, 0.3)" 
                                                    : "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0, 0, 0, 0.08)",
                                                fontSize: 11.5, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                                                fontFamily: font, letterSpacing: "0.2px",
                                                WebkitFontSmoothing: "antialiased",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                                transition: "all 0.15s ease",
                                                opacity: loading ? 0.7 : 1,
                                            }}
                                            onMouseEnter={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = "linear-gradient(180deg, #2a2f3d 0%, #171b24 100%)";
                                                    e.currentTarget.style.boxShadow = "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.1)";
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = "linear-gradient(180deg, #222733 0%, #12151c 100%)";
                                                    e.currentTarget.style.boxShadow = "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0, 0, 0, 0.08)";
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

                                 {/* Bottom link */}
                                 <div style={{ textAlign: "center", marginTop: 20 }}>
                                     <p style={{ fontSize: 10.5, color: themeSubtextColor, fontFamily: font, margin: 0, fontWeight: 400 }}>
                                         {t("noAccount") === "Don't have an account?" || t("noAccount") === "Vous n'avez pas de compte ?" ? "Don't have an account yet?" : t("noAccount")}{" "}
                                         <Link to="/register" style={{
                                             color: themeBottomLinkColor, fontWeight: 600,
                                             textDecoration: "underline", textUnderlineOffset: 3,
                                         }}>
                                             {t("signUp") === "Sign up" || t("signUp") === "S'inscrire" ? "Sign up" : t("signUp")}
                                         </Link>
                                     </p>
                                 </div>
                            </div>

                            {/* ──── REGISTER FORM VIEW ──── */}
                            <div style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                justifyContent: "space-between",
                                opacity: isRegister ? 1 : 0,
                                visibility: isRegister ? "visible" : "hidden",
                                transition: "opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.4s",
                                position: isRegister ? "relative" : "absolute",
                                pointerEvents: isRegister ? "auto" : "none",
                                top: 0, left: 0, right: 0,
                            }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {/* Heading */}
                                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                                        <h1 style={{
                                            fontSize: 20,
                                            fontWeight: 600,
                                            color: themeHeadingColor,
                                            margin: "0 0 4px",
                                            letterSpacing: "-0.5px",
                                            fontFamily: font,
                                        }}>
                                            {t("letsJoinUs") === "Let's join with us" || t("letsJoinUs") === "Rejoignez-nous" ? "Create Account" : "Create Account"}
                                        </h1>
                                        <p style={{
                                            fontSize: 11,
                                            color: themeSubtextColor,
                                            margin: 0,
                                            fontWeight: 400,
                                            fontFamily: font,
                                        }}>
                                            Please enter your details to sign up.
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                                        {/* Register As (Role Toggle) */}
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={{
                                                display: "block", fontSize: 11, fontWeight: 500,
                                                color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                            }}>{t("registerAs")}</label>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: 2,
                                                background: themeToggleBg,
                                                borderRadius: 6,
                                                border: themeToggleBorder,
                                            }}>
                                                <button type="button" onClick={() => setRole("STUDENT")}
                                                    style={{
                                                        flex: 1, height: 26, borderRadius: 4,
                                                        background: role === "STUDENT" ? themeToggleActiveBg : "transparent",
                                                        fontSize: 10.5, fontWeight: role === "STUDENT" ? 600 : 500,
                                                        color: role === "STUDENT" ? themeTextColor : "#8e8e93",
                                                        border: "none", cursor: "pointer",
                                                        boxShadow: role === "STUDENT" ? themeToggleActiveShadow : "none",
                                                        transition: "all 0.15s",
                                                    }}
                                                >
                                                    Student
                                                </button>
                                                <button type="button" onClick={() => setRole("COMPANY")}
                                                    style={{
                                                        flex: 1, height: 26, borderRadius: 4,
                                                        background: role === "COMPANY" ? themeToggleActiveBg : "transparent",
                                                        fontSize: 10.5, fontWeight: role === "COMPANY" ? 600 : 500,
                                                        color: role === "COMPANY" ? themeTextColor : "#8e8e93",
                                                        border: "none", cursor: "pointer",
                                                        boxShadow: role === "COMPANY" ? themeToggleActiveShadow : "none",
                                                        transition: "all 0.15s",
                                                    }}
                                                >
                                                    Company
                                                </button>
                                            </div>
                                        </div>

                                        {/* Student Name Fields */}
                                        {role === "STUDENT" ? (
                                            <>
                                                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{
                                                            display: "block", fontSize: 11, fontWeight: 500,
                                                            color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                        }}>First Name</label>
                                                        <input
                                                            type="text"
                                                            value={firstName}
                                                            onChange={(e) => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: null })) }}
                                                            style={{
                                                                width: "100%", height: 32, padding: "0 10px",
                                                                borderRadius: 6, border: errors.firstName ? "1px solid #ff3b30" : themeInputBorder,
                                                                background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                                outline: "none", fontFamily: font, boxSizing: "border-box",
                                                            }}
                                                        />
                                                        {errors.firstName && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.firstName}</p>}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{
                                                            display: "block", fontSize: 11, fontWeight: 500,
                                                            color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                        }}>Last Name</label>
                                                        <input
                                                            type="text"
                                                            value={lastName}
                                                            onChange={(e) => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: null })) }}
                                                            style={{
                                                                width: "100%", height: 32, padding: "0 10px",
                                                                borderRadius: 6, border: errors.lastName ? "1px solid #ff3b30" : themeInputBorder,
                                                                background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                                outline: "none", fontFamily: font, boxSizing: "border-box",
                                                            }}
                                                        />
                                                        {errors.lastName && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.lastName}</p>}
                                                    </div>
                                                </div>

                                                {/* University Selection */}
                                                <div style={{ marginBottom: 10 }}>
                                                    <label style={{
                                                        display: "block", fontSize: 11, fontWeight: 500,
                                                        color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                    }}>University</label>
                                                    <select
                                                        value={university}
                                                        onChange={(e) => { setUniversity(e.target.value); setErrors(p => ({ ...p, university: null })) }}
                                                        style={{
                                                            width: "100%",
                                                            height: 32,
                                                            padding: "0 24px 0 10px",
                                                            borderRadius: 6,
                                                            border: errors.university ? "1px solid #ff3b30" : themeInputBorder,
                                                            background: themeInputBg,
                                                            fontSize: 11,
                                                            color: university ? themeTextColor : "#8e8e93",
                                                            outline: "none",
                                                            fontFamily: font,
                                                            boxSizing: "border-box",
                                                            cursor: "pointer",
                                                            appearance: "none",
                                                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                            backgroundRepeat: "no-repeat",
                                                            backgroundPosition: "right 8px center",
                                                            backgroundSize: "12px",
                                                        }}
                                                    >
                                                        <option value="" disabled style={{ color: "#8e8e93", background: themeCardBg }}>Select your university</option>
                                                        {universities.map((u) => (
                                                            <option key={u} value={u} style={{ color: themeTextColor, background: themeCardBg }}>{u}</option>
                                                        ))}
                                                    </select>
                                                    {errors.university && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.university}</p>}
                                                </div>

                                                {/* Department Selection */}
                                                <div style={{ marginBottom: 10 }}>
                                                    <label style={{
                                                        display: "block", fontSize: 11, fontWeight: 500,
                                                        color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                    }}>Department</label>
                                                    <select
                                                        value={major}
                                                        onChange={(e) => { setMajor(e.target.value); setErrors(p => ({ ...p, major: null })) }}
                                                        style={{
                                                            width: "100%",
                                                            height: 32,
                                                            padding: "0 24px 0 10px",
                                                            borderRadius: 6,
                                                            border: errors.major ? "1px solid #ff3b30" : themeInputBorder,
                                                            background: themeInputBg,
                                                            fontSize: 11,
                                                            color: major ? themeTextColor : "#8e8e93",
                                                            outline: "none",
                                                            fontFamily: font,
                                                            boxSizing: "border-box",
                                                            cursor: "pointer",
                                                            appearance: "none",
                                                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                            backgroundRepeat: "no-repeat",
                                                            backgroundPosition: "right 8px center",
                                                            backgroundSize: "12px",
                                                        }}
                                                    >
                                                        <option value="" disabled style={{ color: "#8e8e93", background: themeCardBg }}>Select your department</option>
                                                        {departments.map((d) => (
                                                            <option key={d} value={d} style={{ color: themeTextColor, background: themeCardBg }}>{d}</option>
                                                        ))}
                                                    </select>
                                                    {errors.major && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.major}</p>}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Company Name */}
                                                <div style={{ marginBottom: 10 }}>
                                                    <label style={{
                                                        display: "block", fontSize: 11, fontWeight: 500,
                                                        color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                    }}>Company Name</label>
                                                    <input
                                                        type="text"
                                                        value={username}
                                                        onChange={(e) => { setUsername(e.target.value); setErrors(p => ({ ...p, username: null })) }}
                                                        placeholder="Name of Company"
                                                        style={{
                                                            width: "100%", height: 32, padding: "0 10px",
                                                            borderRadius: 6, border: errors.username ? "1px solid #ff3b30" : themeInputBorder,
                                                            background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                            outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        }}
                                                    />
                                                    {errors.username && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.username}</p>}
                                                </div>

                                                {/* Registration Number (Optional) */}
                                                <div style={{ marginBottom: 10 }}>
                                                    <label style={{
                                                        display: "block", fontSize: 11, fontWeight: 500,
                                                        color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                                    }}>Registration Number (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={registrationNumber}
                                                        onChange={(e) => setRegistrationNumber(e.target.value)}
                                                        placeholder="MAT-XXXXXXXXX"
                                                        style={{
                                                            width: "100%", height: 32, padding: "0 10px",
                                                            borderRadius: 6, border: themeInputBorder,
                                                            background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                            outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Email */}
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={{
                                                display: "block", fontSize: 11, fontWeight: 500,
                                                color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                            }}>Email Address</label>
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })) }}
                                                placeholder={role === "STUDENT" ? "yourname@univ.dz" : "company@domain.com"}
                                                style={{
                                                    width: "100%", height: 32, padding: "0 10px",
                                                    borderRadius: 6, border: errors.email ? "1px solid #ff3b30" : themeInputBorder,
                                                    background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                    outline: "none", fontFamily: font, boxSizing: "border-box",
                                                }}
                                            />
                                            {errors.email && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.email}</p>}
                                        </div>

                                        {/* Password */}
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={{
                                                display: "block", fontSize: 11, fontWeight: 500,
                                                color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                            }}>Password</label>
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null })) }}
                                                    style={{
                                                        width: "100%", height: 32, padding: "0 34px 0 12px",
                                                        borderRadius: 6, border: errors.password ? "1px solid #ff3b30" : themeInputBorder,
                                                        background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                        outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        transition: "border-color 0.15s",
                                                    }}
                                                    onFocus={e => { if (!errors.password) { e.target.style.borderColor = themeInputFocusBorder } }}
                                                    onBlur={e => { if (!errors.password) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea" } }}
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
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
                                            {errors.password && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.password}</p>}
                                        </div>

                                        {/* Confirm Password */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{
                                                display: "block", fontSize: 11, fontWeight: 500,
                                                color: themeLabelColor, marginBottom: 4, fontFamily: font,
                                            }}>Confirm Password</label>
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: null })) }}
                                                    style={{
                                                        width: "100%", height: 32, padding: "0 34px 0 12px",
                                                        borderRadius: 6, border: errors.confirmPassword ? "1px solid #ff3b30" : themeInputBorder,
                                                        background: themeInputBg, fontSize: 11, color: themeTextColor,
                                                        outline: "none", fontFamily: font, boxSizing: "border-box",
                                                        transition: "border-color 0.15s",
                                                    }}
                                                    onFocus={e => { if (!errors.confirmPassword) { e.target.style.borderColor = themeInputFocusBorder } }}
                                                    onBlur={e => { if (!errors.confirmPassword) { e.target.style.borderColor = isDark ? "#2d2d30" : "#e5e5ea" } }}
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                                    {showConfirmPassword ? (
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
                                            {errors.confirmPassword && <p style={{ fontSize: 9.5, color: "#ff3b30", marginTop: 2 }}>{errors.confirmPassword}</p>}
                                        </div>

                                        {/* Sign Up Button */}
                                        <button type="submit" disabled={loading}
                                            style={{
                                                width: "100%", height: 34,
                                                background: isDark ? "linear-gradient(180deg, #3a3f50 0%, #1c202b 100%)" : "linear-gradient(180deg, #222733 0%, #12151c 100%)",
                                                color: "#ffffff",
                                                border: isDark ? "1px solid #1c202b" : "1px solid #0d1015",
                                                borderRadius: 6,
                                                boxShadow: isDark 
                                                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 5px rgba(0, 0, 0, 0.3)" 
                                                    : "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0, 0, 0, 0.08)",
                                                fontSize: 11.5, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                                                fontFamily: font, letterSpacing: "0.2px",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                                transition: "all 0.15s ease",
                                                opacity: loading ? 0.7 : 1,
                                            }}
                                            onMouseEnter={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = isDark ? "linear-gradient(180deg, #444a5d 0%, #222734 100%)" : "linear-gradient(180deg, #2a2f3d 0%, #171b24 100%)";
                                                    e.currentTarget.style.boxShadow = isDark ? "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.4)" : "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.1)";
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!loading) {
                                                    e.currentTarget.style.background = isDark ? "linear-gradient(180deg, #3a3f50 0%, #1c202b 100%)" : "linear-gradient(180deg, #222733 0%, #12151c 100%)";
                                                    e.currentTarget.style.boxShadow = isDark ? "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 5px rgba(0, 0, 0, 0.3)" : "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0, 0, 0, 0.08)";
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Signing up...</>
                                            ) : "Sign Up"}
                                        </button>
                                    </form>
                                </div>

                                {/* Bottom link */}
                                <div style={{ textAlign: "center", marginTop: 14 }}>
                                    <p style={{ fontSize: 10.5, color: themeSubtextColor, fontFamily: font, margin: 0, fontWeight: 400 }}>
                                        Already have an account?{" "}
                                        <Link to="/login" style={{
                                            color: themeBottomLinkColor, fontWeight: 600,
                                            textDecoration: "underline", textUnderlineOffset: 3,
                                        }}>
                                            Log in
                                        </Link>
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ═══════ RIGHT — Image + Testimonial ═══════ */}
                <div className={`login-image-side ${isRegister ? "register-mode" : ""}`} style={{
                    width: "50%", position: "relative", overflow: "hidden",
                    margin: 10, borderRadius: 16,
                }}>
                    <img src={premiumPhoto} alt="Professional workspace"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                    }} />

                    {/* Testimonial Glass Card */}
                    <div style={{
                        position: "absolute", bottom: 20, left: 20, right: 20,
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                        borderRadius: 16, padding: "12px 16px 12px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                            }}>
                        <p style={{
                            fontSize: 12, color: "#ffffff", lineHeight: 1.35,
                            fontWeight: 400, margin: "0 0 12px 0", fontFamily: font, letterSpacing: "-0.1px",
                            opacity: 0.95,
                        }}>
                            &ldquo;With App, I can manage my global property portfolio and complete secure transactions in minutes &mdash; all with crypto. It's the perfect blend of real estate and blockchain innovation.&rdquo;
                        </p>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0, fontFamily: font }}>Liam Smith</p>
                                <p style={{ fontSize: 10.5, fontWeight: 600, color: "#ffffff", opacity: 0.85, margin: "2px 0 0", fontFamily: font }}>Investor</p>
                                <p style={{ fontSize: 9.5, fontWeight: 400, color: "#ffffff", opacity: 0.55, margin: "2px 0 0", fontFamily: font }}>Global Real Estate Investment Firm</p>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                {[
                                    { icon: <ArrowLeft size={16} color="#ffffff" strokeWidth={1.75} /> },
                                    { icon: <ArrowRight size={16} color="#ffffff" strokeWidth={1.75} /> }
                                ].map((btn, i) => (
                                    <button key={i} style={{
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
                                        {btn.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

            <style>{`
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

                .login-form-side {
                    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .login-image-side {
                    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
                }

                @media (min-width: 901px) {
                    .login-form-side.register-mode {
                        transform: translateX(100%);
                    }
                    .login-image-side.register-mode {
                        transform: translateX(-100%);
                    }
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
