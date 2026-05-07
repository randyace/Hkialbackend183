import { createBrowserRouter, useNavigate, useParams, useLocation, Navigate } from 'react-router';

import { Layout } from './components/Layout';
import { DashboardPreview } from '../__fixtures__/previews/DashboardPreview';
import { AccountListPreview } from '../__fixtures__/previews/AccountListPreview';
import { ApplicationReview } from './components/ApplicationReview';
import { AccountCreation } from './components/AccountCreation';
import { MemberCompanyPreview } from '../__fixtures__/previews/MemberCompanyPreview';
import { CompanyEdit } from './components/CompanyEdit';
import { Reports } from './components/Reports';
import { TravelAgencyPreview } from '../__fixtures__/previews/TravelAgencyPreview';
import { TravelAgencyDetail } from './components/TravelAgencyDetail';
import { MemberDetail } from './components/MemberDetail';
import { BookingManagementPreview } from '../__fixtures__/previews/BookingManagementPreview';
import { CreateBooking } from './components/CreateBooking';
import { BookingDetail } from './components/BookingDetail';
import { BookingSettings } from './components/BookingSettings';
import { BookingApproval } from './components/BookingApproval';
import { SupervisingApproval } from './components/SupervisingApproval';
import { BookingSchedules } from './components/BookingSchedules';
import { SuiteBookingSchedules } from './components/SuiteBookingSchedules';
import { TableBookingSchedules } from './components/TableBookingSchedules';
import { BookableItemsPreview } from '../__fixtures__/previews/BookableItemsPreview';
import { BookableItemEdit } from './components/BookableItemEdit';
import { POSFloorPlan } from './components/POSFloorPlan';
import { POSCheckout } from './components/POSCheckout';
import { POSBookingDetailPreview } from '../__fixtures__/previews/POSBookingDetailPreview';
import { KitchenDisplay } from './components/KitchenDisplay';
import { LoungeLayoutPreview } from '../__fixtures__/previews/LoungeLayoutPreview';
import { SystemUsersPreview } from '../__fixtures__/previews/SystemUsersPreview';
import { AuditLogsPreview } from '../__fixtures__/previews/AuditLogsPreview';
import { PromoCodeListPreview } from '../__fixtures__/previews/PromoCodeListPreview';
import { PromoCodeEdit } from './components/PromoCodeEdit';
import { PromoCodeUsage } from './components/PromoCodeUsage';
import { PromoCodeGeneratedPage, GeneratedCodesData } from './components/PromoCodeGeneratedPage';
import { GradingPackagesPreview } from '../__fixtures__/previews/GradingPackagesPreview';
import { PurchaseManagement } from './components/PurchaseManagement';
import { BalanceTracker } from './components/BalanceTracker';
import { CorporateReports } from './components/CorporateReports';
import { OpportunityTrackingPreview } from '../__fixtures__/previews/OpportunityTrackingPreview';
import { RefundReport } from './components/RefundReport';
import { PreOrderPage } from './components/PreOrderPage';

// ── Fallback for unknown routes ───────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="p-6 text-center">
      <h1 className="text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// ── Page Wrappers ─────────────────────────────────────────────────────────────

function CustomerListPage() {
  const navigate = useNavigate();
  return (
    <AccountListPreview
      onViewDetail={(accountNo) => navigate(`/customer/detail/${encodeURIComponent(accountNo)}`)}
    />
  );
}

function CustomerDetailPage() {
  const { accountNo } = useParams<{ accountNo: string }>();
  const navigate = useNavigate();
  if (!accountNo) return <Navigate to="/customer" replace />;
  return (
    <MemberDetail
      accountNumber={decodeURIComponent(accountNo)}
      onBack={() => navigate(-1)}
    />
  );
}

function CustomerCompanyPage() {
  const navigate = useNavigate();
  return (
    <MemberCompanyPreview
      onEditCompany={(id) => navigate(`/customer/company/edit/${id}`)}
      onCreateCompany={() => navigate('/customer/company/create')}
    />
  );
}

function CompanyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <CompanyEdit
      companyId={id ? parseInt(id) : null}
      onBack={() => navigate('/customer/company')}
    />
  );
}

function CompanyCreatePage() {
  const navigate = useNavigate();
  return <CompanyEdit companyId={null} onBack={() => navigate('/customer/company')} />;
}

function TravelAgencyPage() {
  const navigate = useNavigate();
  return (
    <TravelAgencyPreview
      onEditAgency={(id) => navigate(`/travel-agency/edit/${id}`)}
    />
  );
}

function TravelAgencyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <TravelAgencyDetail
      agencyId={id ? parseInt(id) : null}
      onBack={() => navigate('/travel-agency')}
    />
  );
}

function TravelAgencyCreatePage() {
  const navigate = useNavigate();
  return <TravelAgencyDetail agencyId={null} onBack={() => navigate('/travel-agency')} />;
}

function BookingListPage() {
  const navigate = useNavigate();
  return (
    <BookingManagementPreview
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
    />
  );
}

function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/booking" replace />;
  return (
    <BookingDetail
      bookingId={parseInt(id)}
      onBack={() => navigate(-1)}
    />
  );
}

function BookingSettingsPage() {
  const navigate = useNavigate();
  return <BookingSettings onBack={() => navigate('/booking')} />;
}

function BookingApprovalPage() {
  const navigate = useNavigate();
  return (
    <BookingApproval
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
    />
  );
}

function SupervisingApprovalPage() {
  const navigate = useNavigate();
  return (
    <SupervisingApproval
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
    />
  );
}

function BookingSchedulesPage() {
  const navigate = useNavigate();
  return (
    <BookingSchedules
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
      onPreOrder={(booking) =>
        navigate('/booking/pre-order', {
          state: { booking, originUrl: '/booking/schedules' },
        })
      }
    />
  );
}

function SuiteBookingSchedulesPage() {
  const navigate = useNavigate();
  return (
    <SuiteBookingSchedules
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
      onPreOrder={(booking) =>
        navigate('/booking/pre-order', {
          state: { booking, originUrl: '/booking/schedules/suite' },
        })
      }
    />
  );
}

function TableBookingSchedulesPage() {
  const navigate = useNavigate();
  return (
    <TableBookingSchedules
      onViewDetail={(id) => navigate(`/booking/detail/${id}`)}
      onPreOrder={(booking) =>
        navigate('/booking/pre-order', {
          state: { booking, originUrl: '/booking/schedules/table' },
        })
      }
    />
  );
}

function PreOrderRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const originUrl: string = location.state?.originUrl || '/booking/schedules';
  if (!booking) return <Navigate to={originUrl} replace />;
  return (
    <PreOrderPage
      booking={booking}
      onBack={() => navigate(originUrl)}
      onSaved={() => navigate(originUrl)}
    />
  );
}

function BookableItemsPage() {
  const navigate = useNavigate();
  return (
    <BookableItemsPreview
      onEditItem={(id) => navigate(`/bookable-items/edit/${id}`)}
      onCreateItem={() => navigate('/bookable-items/create')}
    />
  );
}

function BookableItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <BookableItemEdit
      itemId={id ? parseInt(id) : null}
      onBack={() => navigate('/bookable-items')}
    />
  );
}

function BookableItemCreatePage() {
  const navigate = useNavigate();
  return <BookableItemEdit itemId={null} onBack={() => navigate('/bookable-items')} />;
}

function POSFloorPlanPage() {
  const navigate = useNavigate();
  return (
    <POSFloorPlan
      onViewBookingDetail={(bookingNo) => navigate(`/pos/booking/${encodeURIComponent(bookingNo)}`)}
      onCheckout={(bookingNo) => navigate(`/pos/checkout/${encodeURIComponent(bookingNo)}`)}
    />
  );
}

function POSBookingDetailPage() {
  const { bookingNo } = useParams<{ bookingNo: string }>();
  const navigate = useNavigate();
  if (!bookingNo) return <Navigate to="/pos" replace />;
  return (
    <POSBookingDetailPreview
      bookingNo={decodeURIComponent(bookingNo)}
      onBack={() => navigate('/pos')}
    />
  );
}

function POSCheckoutPage() {
  const { bookingNo } = useParams<{ bookingNo: string }>();
  const navigate = useNavigate();
  if (!bookingNo) return <Navigate to="/pos" replace />;
  return (
    <POSCheckout
      bookingNo={decodeURIComponent(bookingNo)}
      onBack={() => navigate('/pos')}
    />
  );
}

function PromoCodeListPage() {
  const navigate = useNavigate();
  return (
    <PromoCodeListPreview
      onEditPromoCode={(id) => navigate(`/promo-codes/edit/${id}`)}
      onCreatePromoCode={() => navigate('/promo-codes/create')}
    />
  );
}

function PromoCodeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <PromoCodeEdit
      promoCodeId={id ? parseInt(id) : null}
      onBack={() => navigate('/promo-codes')}
      onNavigateToCodesPage={(data: GeneratedCodesData) =>
        navigate('/promo-codes/generated', { state: { data } })
      }
    />
  );
}

function PromoCodeCreatePage() {
  const navigate = useNavigate();
  return (
    <PromoCodeEdit
      promoCodeId={null}
      onBack={() => navigate('/promo-codes')}
      onNavigateToCodesPage={(data: GeneratedCodesData) =>
        navigate('/promo-codes/generated', { state: { data } })
      }
    />
  );
}

function PromoCodeGeneratedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data as GeneratedCodesData | undefined;
  if (!data) return <Navigate to="/promo-codes" replace />;
  return (
    <PromoCodeGeneratedPage
      data={data}
      onBack={() => navigate('/promo-codes')}
    />
  );
}

function CustomerCreatePage() {
  return <AccountCreation type="individual" />;
}

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      // Default redirect to /dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Dashboard
      { path: 'dashboard', Component: DashboardPreview },

      // Customers
      { path: 'customer',                  Component: CustomerListPage },
      { path: 'customer/create',           Component: CustomerCreatePage },
      { path: 'customer/approve',          Component: ApplicationReview },
      { path: 'customer/detail/:accountNo', Component: CustomerDetailPage },
      { path: 'customer/company',          Component: CustomerCompanyPage },
      { path: 'customer/company/create',   Component: CompanyCreatePage },
      { path: 'customer/company/edit/:id', Component: CompanyEditPage },
      { path: 'customer/report',           Component: Reports },

      // Travel Agency
      { path: 'travel-agency',          Component: TravelAgencyPage },
      { path: 'travel-agency/create',   Component: TravelAgencyCreatePage },
      { path: 'travel-agency/edit/:id', Component: TravelAgencyEditPage },

      // Membership / Contracts
      { path: 'membership/packages', Component: GradingPackagesPreview },
      { path: 'membership/purchase', Component: PurchaseManagement },
      { path: 'membership/balance',  Component: BalanceTracker },

      // Bookings
      { path: 'booking',                Component: BookingListPage },
      { path: 'booking/create',         Component: CreateBooking },
      { path: 'booking/detail/:id',     Component: BookingDetailPage },
      { path: 'booking/approve',        Component: BookingApprovalPage },
      { path: 'booking/supervising',    Component: SupervisingApprovalPage },
      { path: 'booking/settings',       Component: BookingSettingsPage },
      { path: 'booking/pre-order',      Component: PreOrderRoute },
      { path: 'booking/report',         Component: Reports },

      // Booking Schedules
      { path: 'booking/schedules',       Component: BookingSchedulesPage },
      { path: 'booking/schedules/suite', Component: SuiteBookingSchedulesPage },
      { path: 'booking/schedules/table', Component: TableBookingSchedulesPage },

      // Bookable Items
      { path: 'bookable-items',          Component: BookableItemsPage },
      { path: 'bookable-items/create',   Component: BookableItemCreatePage },
      { path: 'bookable-items/edit/:id', Component: BookableItemEditPage },
      { path: 'bookable-items/report',   Component: Reports },

      // POS
      { path: 'pos',                       Component: POSFloorPlanPage },
      { path: 'pos/booking/:bookingNo',    Component: POSBookingDetailPage },
      { path: 'pos/checkout/:bookingNo',   Component: POSCheckoutPage },
      { path: 'pos/transactions',          Component: BookingListPage },
      { path: 'pos/kitchen',               Component: KitchenDisplay },

      // Lounge
      { path: 'lounge', Component: LoungeLayoutPreview },

      // Promo Codes
      { path: 'promo-codes',            Component: PromoCodeListPage },
      { path: 'promo-codes/create',     Component: PromoCodeCreatePage },
      { path: 'promo-codes/edit/:id',   Component: PromoCodeEditPage },
      { path: 'promo-codes/usage',      Component: PromoCodeUsage },
      { path: 'promo-codes/generated',  Component: PromoCodeGeneratedRoute },

      // Reports & Analytics
      { path: 'reports',            Component: Reports },
      { path: 'reports/analytics',  Component: Reports },
      { path: 'reports/corporate',  Component: CorporateReports },
      { path: 'reports/refund',     Component: RefundReport },

      // System
      { path: 'system/users', Component: SystemUsersPreview },
      { path: 'system/audit', Component: AuditLogsPreview },

      // CRM
      { path: 'crm/opportunities', Component: OpportunityTrackingPreview },

      // 404
      { path: '*', Component: NotFound },
    ],
  },
]);