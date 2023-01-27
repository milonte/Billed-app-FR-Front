/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy()
    })

    test("Then bills should be displayed", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      expect(screen.getByTestId("tbody").children.length).toBe(4)
      expect(screen.getByText("encore")).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      //const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const dates = screen.getAllByTestId("bill-date").map(a => a.innerHTML)
      const antiChrono = (a, b) => (new Date(b).getTime() - new Date(a).getTime())
      const datesSorted = [...dates].sort(antiChrono)
      console.log(dates, datesSorted)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on eye icon", () => {
    test("Then modal should be displayed", async () => {
      // Override jQuery modal function
      // Necessary for testing
      $.fn.modal = jest.fn(() => {
        const modal = screen.getByTestId("modaleFile")
        modal.classList.add("show")
        modal.style.display = "block"
      })

      // initialize Bills with fixtures
      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      // setup html elements
      document.body.innerHTML = BillsUI({ data: bills })

      // get Eye icon
      const icon = screen.getAllByTestId("icon-eye")[0]

      // set up eye icon event listener
      const handleClickIconEye = jest.fn((e) => billsContainer.handleClickIconEye(icon))
      icon.addEventListener("click", handleClickIconEye)

      // user click on eye icon
      userEvent.click(icon)

      // event listener should be called
      expect(handleClickIconEye).toHaveBeenCalled()

      // modal should be displayed
      expect(screen.getByTestId("modaleFile").classList.contains("show")).toBeTruthy()
      expect(screen.getByTestId("modaleFile").style.display).toBe("block")
    })
  })

  describe("When I click on the new Bill button", () => {
    test("Then new bill form should be displayed", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      //setup html elements
      document.body.innerHTML = BillsUI({ data: bills })

      const handleClickNewBill = jest.fn((e) => billsContainer.handleClickNewBill())

      const newBillBtn = screen.getByTestId("btn-new-bill")
      document.body.innerHTML = BillsUI({ data: bills })

      newBillBtn.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillBtn)
      expect(handleClickNewBill).toHaveBeenCalled()

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()

    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      // Necessary to call mockStore to simulate API call
      const billsContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      // get items in mockStore
      const mockBills = await waitFor(() => billsContainer.getBills())

      expect(mockBills.length).toBe(4)
      expect(mockBills[0].name).toBe("encore")
    })
  })

  describe("When an error occurs on API", () => {

    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

})