import { createContext, useContext } from "react";

// Minimal language provider stub — always returns English.
// Extend this later if multilanguage support is needed.

const translations = {
    login: "Login",
    signUp: "Sign up",
    letsJoinUs: "Welcome!",
    signInJoin: "Please enter your details to login.",
    email: "Email address",
    enterEmail: "Enter your email address",
    password: "Password",
    enterPassword: "Enter your password",
    loggingIn: "Logging in...",
    noAccount: "Don't have an account yet?",
    registerAs: "Register as",
    forgotPasswordTitle: "Forgot Password",
    verifyCode: "Verify Code",
    newPasswordTitle: "New Password",
    forgotSubtitle1: "Enter your email to receive a reset code.",
    forgotSubtitle2: "We sent a 6-digit code to",
    forgotSubtitle3: "Enter your new password below.",
    emailAddress: "Email Address",
    sendResetCode: "Send Reset Code",
    enter6Digit: "Please enter all 6 digits.",
    invalidCode: "Invalid or expired code.",
    verifyCodeBtn: "Verify Code",
    didntReceive: "Didn't receive it?",
    resendIn: "Resend in",
    resendCode: "Resend",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm Password",
    resetPasswordBtn: "Reset Password",
    passwordReset: "Password Reset!",
    passwordResetSuccess: "Your password has been reset successfully. You can now log in.",
    backToSignIn: "Back to Sign In",
    enterEmailError: "Please enter your email.",
    validEmailError: "Please enter a valid email.",
    noAccountFound: "No account found with this email.",
    somethingWentWrong: "Something went wrong. Please try again.",
    failedToReset: "Failed to reset password. Please try again.",
    failedToResend: "Failed to resend code.",
    weak: "Weak",
    fair: "Fair",
    strong: "Strong",
    veryStrong: "Very Strong",
    confirmYourPassword: "Please confirm your password.",
    passwordsDoNotMatch: "Passwords do not match.",
    enterNewPassword: "Please enter a new password.",
    passwordLength: "Password must be at least 8 characters.",
};

const LanguageContext = createContext({ t: (key) => translations[key] || key });

export function LanguageProvider({ children }) {
    const t = (key) => translations[key] || key;
    return (
        <LanguageContext.Provider value={{ t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
