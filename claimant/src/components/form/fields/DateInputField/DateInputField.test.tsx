import { render, waitFor, within, screen } from "@testing-library/react";
import { Formik } from "formik";
import { DateInputField } from "./DateInputField";
import { noop } from "../../../../testUtils/noop";
import * as yup from "yup";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("DateInputField Component", () => {
  it("renders the elements that make up the field", () => {
    const { getByLabelText } = render(
      <Formik initialValues={{ dateInputField: "" }} onSubmit={noop}>
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    expect(monthField).toBeInstanceOf(HTMLInputElement);
    expect(monthField).toHaveAttribute("id", "dateInputField.month");
    expect(monthField).toHaveAttribute("name", "dateInputField.month");
    expect(monthField).toHaveValue("");

    expect(dayField).toBeInstanceOf(HTMLInputElement);
    expect(dayField).toHaveAttribute("id", "dateInputField.day");
    expect(dayField).toHaveAttribute("name", "dateInputField.day");
    expect(dayField).toHaveValue("");

    expect(yearField).toBeInstanceOf(HTMLInputElement);
    expect(yearField).toHaveAttribute("id", "dateInputField.year");
    expect(yearField).toHaveAttribute("name", "dateInputField.year");
    expect(yearField).toHaveValue("");
  });

  it("Renders a label", () => {
    const { getByRole } = render(
      <Formik initialValues={{ dateInputField: "" }} onSubmit={noop}>
        <DateInputField
          id={"dateInputField"}
          name={"dateInputField"}
          legend={"legend"}
        />
      </Formik>
    );

    const fieldset = getByRole("group", { name: "legend" });
    const monthField = within(fieldset).getByLabelText("date.month.label");
    const dayField = within(fieldset).getByLabelText("date.day.label");
    const yearField = within(fieldset).getByLabelText("date.year.label");

    expect(fieldset).toBeInTheDocument();
    expect(fieldset).toBeInstanceOf(HTMLFieldSetElement);
    expect(monthField).toBeInTheDocument();
    expect(dayField).toBeInTheDocument();
    expect(yearField).toBeInTheDocument();
  });

  it("renders a hint", () => {
    const { queryByText } = render(
      <Formik initialValues={{ dateInputField: "" }} onSubmit={noop}>
        <DateInputField
          id={"dateInputField"}
          name={"dateInputField"}
          hint="Here's a clue!"
        />
      </Formik>
    );

    const hint = queryByText("Here's a clue!");

    expect(hint).toBeInTheDocument();
    expect(hint).toHaveClass("usa-hint");
  });

  it("accepts and parses an initial value properly", () => {
    const { getByLabelText } = render(
      <Formik initialValues={{ dateInputField: "1885-01-13" }} onSubmit={noop}>
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    expect(monthField).toHaveValue("01");
    expect(dayField).toHaveValue("13");
    expect(yearField).toHaveValue("1885");
  });

  it("Displays an error when the field is touched and blurred", async () => {
    const { getByLabelText, queryByRole } = render(
      <Formik
        initialValues={{ dateInputField: "" }}
        validationSchema={yup.object().shape({
          dateInputField: yup.date().required(),
        })}
        onSubmit={noop}
      >
        {({ submitForm }) => {
          return (
            <>
              <DateInputField id={"dateInputField"} name={"dateInputField"} />
              <button type="submit" onClick={submitForm}>
                Submit
              </button>
            </>
          );
        }}
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    // Focus the month input
    userEvent.click(monthField);
    await waitFor(() => {
      expect(monthField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab to the day input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab to the year input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    userEvent.click(screen.getByRole("button"));
    // Tab away from the year field, blurs the entire field and triggers validation as a result
    await waitFor(() => {
      expect(monthField).not.toHaveFocus();
      expect(dayField).not.toHaveFocus();
      expect(yearField).not.toHaveFocus();

      expect(queryByRole("alert")).toBeInTheDocument();
    });
  });

  it("Allows the user to enter a date", async () => {
    const { getByLabelText, queryByRole } = render(
      <Formik
        initialValues={{ dateInputField: "" }}
        validationSchema={yup.object().shape({
          dateInputField: yup.date().required(),
        })}
        onSubmit={noop}
      >
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    // Focus the month input and type a month
    userEvent.type(monthField, "01");
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Continue typing a day since the day input has focus
    userEvent.keyboard("02");
    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // continue typing a year since the year field has focus
    userEvent.keyboard("2000");

    await waitFor(() => {
      expect(yearField).toHaveFocus();
    });

    // Tab away from the year field, blurs the entire field. No Error should be present
    userEvent.tab();
    await waitFor(() => {
      expect(monthField).not.toHaveFocus();
      expect(dayField).not.toHaveFocus();
      expect(yearField).not.toHaveFocus();

      expect(monthField).toHaveValue("01");
      expect(dayField).toHaveValue("02");
      expect(yearField).toHaveValue("2000");

      expect(queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("Allows the user erase a date", async () => {
    const { getByLabelText } = render(
      <Formik
        initialValues={{ dateInputField: "" }}
        validationSchema={yup.object().shape({
          dateInputField: yup.date().required(),
        })}
        onSubmit={noop}
      >
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    // Enter a date by typing in the field:
    userEvent.type(monthField, "01");
    userEvent.keyboard("02");
    userEvent.keyboard("2000");

    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(monthField).toHaveValue("01");
      expect(dayField).toHaveValue("02");
      expect(yearField).toHaveValue("2000");
    });

    // Erase the year
    userEvent.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}");
    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(yearField).toHaveValue("");
    });

    // The next Backspace moves focus to the day field and erases a character there
    userEvent.keyboard("{Backspace}");
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(dayField).toHaveValue("0");
    });

    // Erase the rest of the day field
    userEvent.keyboard("{Backspace}");
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(dayField).toHaveValue("");
    });

    // The next Backspace moves focus to the month field and erases a character there
    userEvent.keyboard("{Backspace}");
    await waitFor(() => {
      expect(monthField).toHaveFocus();
      expect(monthField).toHaveValue("0");
    });

    // Erase the rest of the month field, leaving the entire date erased
    userEvent.keyboard("{Backspace}");
    await waitFor(() => {
      expect(monthField).toHaveFocus();
      expect(monthField).toHaveValue("");
      expect(dayField).toHaveValue("");
      expect(yearField).toHaveValue("");
    });
  });
});
