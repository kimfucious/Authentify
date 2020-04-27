import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "./shared/Button";
import { Form, Formik, Field, ErrorMessage } from "formik";
import { compact, pick } from "lodash";
import { signInSchema, signUpSchema } from "../helpers";
import { Auth } from "aws-amplify";

export const SignInForm = ({
  formAction,
  isSignInSpinning,
  isSignUpSpinning,
  setConfirmationUsername,
  setFormAction
}) => {
  const dispatch = useDispatch();
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isAppleBtnSpinning, setIsAppleBtnSpinning] = useState(false);
  const [isGoogleBtnSpinning, setIsGoogleBtnSpinning] = useState(false);

  const getBtnText = () => {
    switch (formAction) {
      case "signIn":
        return "Sign in without Password";
      case "signUp":
        return "Sign up";
      default:
        return "You've fucked up the button text";
    }
  };

  const handleResendCode = async (username) => {
    try {
      setIsCodeSent(true);
      await Auth.resendSignUp(username);
      setFormAction("signUp");
      setConfirmationUsername(username);
    } catch (error) {
      setIsCodeSent(false);
      dispatch({ type: "COGNITO_USER_SIGNUP_FAIL", payload: error });
    }
  };
  const getSchema = () => {
    if (formAction === "signUp") {
      console.log("signUp", signUpSchema);
      return signUpSchema;
    } else if (
      formAction === "signIn" &&
      !isAppleBtnSpinning &&
      !isGoogleBtnSpinning
    ) {
      console.log("signIn", signInSchema);
      return signInSchema;
    } else {
      console.log("no schema!", null);
      return null;
    }
  };

  return (
    <Formik
      initialValues={{
        accessCode: "",
        appleEmail: "",
        email: "",
        googleEmail: "",
        password: "",
        signInWithApple: false,
        signInWithGoogle: false,
        username: ""
      }}
      validationSchema={getSchema()}
      onSubmit={async (values, { setSubmitting: setIsSubmitting }) => {
        if (formAction === "signIn") {
          if (values.signInWithApple) {
            try {
              Auth.federatedSignIn({ provider: "SignInWithApple" });
            } catch (error) {
              setIsAppleBtnSpinning(false);
              // handle error
            }
          } else if (values.signInWithGoogle) {
            try {
              console.warn(
                "Signing in with Google.  WTF is the button not spinning?"
              );
              Auth.federatedSignIn({ provider: "Google" });
            } catch (error) {
              setIsGoogleBtnSpinning(false);
              // handle error
            }
          } else {
            alert("I don't do anything yet");
            setIsSubmitting(false);
            // const user = await Auth.signInWithoutPassword(values.username);
            // console.log("SIGN IN WITHOUT PASSWORD:", user);
          }
        } else if (formAction === "signUp") {
          try {
            const cognitoUser = await Auth.signUp({
              username: values.username,
              password: values.password,
              attributes: {
                email: values.email,
                preferred_username: values.email,
                "custom:appleEmail": values.appleEmail,
                "custom:googleEmail": values.googleEmail
              }
            });
            if (!cognitoUser.user.userConfirmed) {
              setConfirmationUsername(cognitoUser.user.username);
            }
            console.warn("Sign Up User: ", cognitoUser);
          } catch (error) {
            setIsSubmitting(false);
            console.warn(error.response || error);
          }
        }
      }}
    >
      {({ errors, values, isSubmitting, setFieldValue }) => {
        const getDisabled = () => {
          if (formAction === "signIn") {
            return !values.username || errors.username;
          } else if (formAction === "signUp") {
            const errs = !!compact(Object.values(errors)).length;
            const vals = !!compact(
              pick(values, "accessCode", "email", "username", "password")
            ).length;
            return errs && vals && isSubmitting;
          }
        };

        return (
          <Form className="d-flex flex-column align-items-center mb-3">
            <div className="d-flex flex-column form-group w-100">
              <label htmlFor="usernameInput">Username</label>
              <Field
                type="text"
                className="form-control"
                id="usernameInput"
                name="username"
                placeholder="Ada"
                aria-describedby="usernameHelp"
              />
              {formAction !== "signIn" && errors.username ? (
                <div className="formikErrorMessage">
                  <ErrorMessage name="username" id="usernameHelp" />
                </div>
              ) : formAction ? (
                <small className="fieldHelperText" id="usernameHelp">
                  Required for Sign in without Password
                </small>
              ) : null}
            </div>
            {formAction === "signUp" ? (
              <>
                <div className="d-flex flex-column form-group w-100">
                  <label htmlFor="emailInput">Email address</label>
                  <Field
                    aria-describedby="emailHelp"
                    className="form-control"
                    id="emailInput"
                    name="email"
                    placeholder="ada@lovelace.com"
                    // onChange={(e) => {
                    // setEmail(e.target.value);
                    // setgoogleEmail(e.target.value);
                    // }}
                    type="text"
                  />
                  <div className="formikErrorMessage">
                    <ErrorMessage
                      name="email"
                      id="emailHelp"
                      className="text-danger"
                    />
                  </div>
                </div>
                <div className="d-flex flex-column form-group w-100">
                  <label htmlFor="passwordInput">Password</label>
                  <Field
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    name="password"
                    placeholder="yun0Work!"
                    aria-describedby="passwordHelp"
                  />
                  <div className="formikErrorMessage">
                    <ErrorMessage name="password" id="passwordHelp" />
                  </div>
                </div>
                <div className="d-flex flex-column form-group w-100">
                  <label htmlFor="accessCodeInput">Access Code</label>
                  <Field
                    type="text"
                    className="form-control"
                    id="accessCodeInput"
                    name="accessCode"
                    placeholder="73WakrfVbNJBaAmhQtEeDv"
                    aria-describedby="accessCodeHelp"
                  />
                  {errors.accessCode ? (
                    <div className="formikErrorMessage">
                      <ErrorMessage name="accessCode" id="accessCodeHelp" />
                    </div>
                  ) : (
                    <small className="fieldHelperText" id="accessCodeHelp">
                      Get this from your administrator
                    </small>
                  )}
                </div>
                <div className="d-flex flex-column form-group w-100">
                  <label htmlFor="appleEmailInput">Apple Email</label>
                  <Field
                    type="text"
                    className="form-control"
                    id="appleEmailInput"
                    name="appleEmail"
                    placeholder="ada@icloud.com"
                    aria-describedby="appleEmailHelp"
                  />
                  {errors.appleEmail ? (
                    <div className="formikErrorMessage">
                      <ErrorMessage name="appleEmail" id="appleEmailHelp" />
                    </div>
                  ) : (
                    <small className="fieldHelperText" id="appleEmailHelp">
                      Optional: if you want to Sign in with Apple
                    </small>
                  )}
                </div>
                <div className="d-flex flex-column form-group w-100">
                  <label htmlFor="googleEmailInput">Google Email</label>
                  <Field
                    type="text"
                    className="form-control"
                    id="googleEmailInput"
                    name="googleEmail"
                    placeholder="ada@gmail.com"
                    aria-describedby="googleEmailHelp"
                  />
                  {errors.googleEmail ? (
                    <div className="formikErrorMessage">
                      <ErrorMessage name="googleEmail" id="googleEmailHelp" />
                    </div>
                  ) : (
                    <small className="fieldHelperText" id="googleEmailHelp">
                      Optional: if you want to Sign in with Google
                    </small>
                  )}
                </div>
              </>
            ) : null}
            <Button
              btnText={getBtnText()}
              className="my-3"
              color="secondary"
              fn={() => {}}
              height={44}
              icon="password"
              isDisabled={getDisabled()}
              isSpinning={isSubmitting}
              type="submit"
              width={240}
            />
            {formAction === "signIn" ? (
              <>
                <Button
                  btnText="Sign in with Apple"
                  className="mb-3"
                  color="light"
                  fn={() => {
                    setIsAppleBtnSpinning(true);
                    setFieldValue("signInWithApple", true, false);
                  }}
                  height={44}
                  icon="apple"
                  isSpinning={isAppleBtnSpinning}
                  type="submit"
                  width={240}
                />
                <Button
                  btnText="Sign in with Google"
                  className="mb-3"
                  color="danger"
                  fn={() => {
                    setIsGoogleBtnSpinning(true);
                    setFieldValue("signInWithGoogle", true, false);
                  }}
                  height={44}
                  icon="google"
                  isSpinning={isGoogleBtnSpinning}
                  spinnerColor="light"
                  type="submit"
                  width={240}
                />
                <div className="d-flex justify-content-center">
                  {/* <Button
              btnText={<small>Forgot Password</small>}
              color="light"
              link
            /> */}
                </div>
              </>
            ) : null}
            <Button
              btnText={
                <small>
                  {formAction === "signIn" ? "New User" : "Existing User"}
                </small>
              }
              fn={() => {
                setFormAction(formAction === "signIn" ? "signUp" : "signIn");
              }}
              color="light"
              link
            />
            {isCodeSent ? (
              <div
                class="spinner-border spinner-border-sm text-light"
                role="status"
              >
                <span class="sr-only">Loading...</span>
              </div>
            ) : (
              <Button
                btnText={<small>Resend Verification Code</small>}
                className="my-0"
                color="light"
                isDisabled={!values.username}
                link
                fn={() => {
                  handleResendCode(values.username);
                }}
                height={44}
                width={240}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
};