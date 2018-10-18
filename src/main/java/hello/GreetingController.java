package hello;

import org.apache.commons.codec.digest.DigestUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.transaction.Transactional;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
@Controller
public class GreetingController {
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm");
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private DateRepository dateRepository;

    @GetMapping("/greeting")
    public String greeting(@RequestParam(name = "name", required = false, defaultValue = "user") String name,
                           @RequestParam(name = "password", required = false, defaultValue = "pass") String password,
                           Map<String, Object> model) {
        Iterable<Accounts> all = accountRepository.findAll();

        model.put("dates", all);
        model.put("name", name);
        return "greeting";
    }

    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/getweekdata", produces = "application/json")
    public String receiveRequest(@RequestParam(name = "id") Integer id,
                                 @RequestParam(name = "date_from") String stringDate_from,
                                 @RequestParam(name = "date_to") String stringDate_to) throws ParseException {
        Calendar dateFrom = new Calendar.Builder().setInstant(dateFormat.parse(stringDate_from)).build();
        Calendar dateTo = new Calendar.Builder().setInstant(dateFormat.parse(stringDate_to)).build();

        Timestamp from = new Timestamp(dateFrom.getTimeInMillis());
        Timestamp to = new Timestamp(dateTo.getTimeInMillis());

        ArrayList<Event>[] dates = new ArrayList[7];
        for (int i = 0; i < dates.length; i++) {
            dates[i] = new ArrayList<>();
        }

        List<Event> result2 = dateRepository.findByAccountIdAndDateFromBetween(id, from, to);
        for (Event date : result2) {
            Calendar current = new Calendar.Builder().setInstant(date.getDateTo().getTime()).build();
            int day = current.get(Calendar.DAY_OF_WEEK);
            int diff = day - dateFrom.get(Calendar.DAY_OF_WEEK);
            if (diff < 0) {
                diff += 7;
            }
            dates[diff].add(date);
        }

        JSONObject result = new JSONObject();
        JSONArray allDays = new JSONArray();
        for (int i = 0; i < dates.length; i++) {
            ArrayList<Event> array = dates[i];
            JSONArray jsonArray = new JSONArray();
            for (Event date : array) {
                JSONObject object = new JSONObject();
                object.put("date_from", dateFormat.format(date.getDateFrom().getTime()));
                object.put("date_to", dateFormat.format(date.getDateTo().getTime()));
                object.put("info", date.getInfo());

                jsonArray.put(object);
            }
            JSONObject day = new JSONObject();
            day.put("index", i);
            day.put("dates", jsonArray.toList());

            allDays.put(day);
        }

        result.put("response_type", "prevDates");
        result.put("dates", allDays);

        return result.toString();
    }

    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/attemptLogin", produces = "application/json")
    public String attemptLogin(@RequestParam(name = "login") String login,
                               @RequestParam(name = "password") String password) {
        JSONObject response = new JSONObject();
        response.put("response_type", "attemptLogin");

        password = DigestUtils.md5Hex(password);

        Accounts account = accountRepository.findByLoginAndPassword(login, password);
        if(account == null) {
            response.put("success", false);
        } else {
            response.put("success", true);
            response.put("id", account.getId());
        }

        return response.toString();
    }

    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/attemptRegister", produces = "application/json")
    public String attemptRegister(@RequestParam(name = "login") String login,
                                  @RequestParam(name = "password") String password) {
        JSONObject response = new JSONObject();
        response.put("response_type", "attemptRegister");
        Accounts account = accountRepository.findByLogin(login);
        if(account == null) {

            password = DigestUtils.md5Hex(password);
            Accounts newAccount = new Accounts(login, password);
            accountRepository.save(newAccount);

            response.put("success", true);
            response.put("id", newAccount.getId());
        } else {
            response.put("success", false);
        }
        return response.toString();
    }

    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/insertDate", produces = "application/json")
    public String insertDate(@RequestParam(name = "id") Integer id,
                             @RequestParam(name = "dateFrom") String stringDateFrom,
                             @RequestParam(name = "dateTo") String stringDateTo,
                             @RequestParam(name = "info") String info) throws ParseException {
        JSONObject response = new JSONObject();
        response.put("response_type", "insertDate");

        Date dateFrom = dateFormat.parse(stringDateFrom);
        Date dateTo = dateFormat.parse(stringDateTo);

        if(!checkUniqueEvent(id, dateFrom, dateTo, -1) || dateFrom.equals(dateTo)) {
            response.put("success", false);
        }
        else {
            dateRepository.save(new Event(id, dateFrom, dateTo, info));
            response.put("success", true);
        }

        return response.toString();
    }

    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/updateDate", produces = "application/json")
    public String updateDate(@RequestParam(name = "id") Integer id,
                             @RequestParam(name = "oldDateFrom") String stringOldDateFrom,
                             @RequestParam(name = "oldDateTo") String stringOldDateTo,
                             @RequestParam(name = "newDateFrom") String stringNewDateFrom,
                             @RequestParam(name = "newDateTo") String stringNewDateTo,
                             @RequestParam(name = "newInfo") String info) throws ParseException {
        JSONObject response = new JSONObject();
        response.put("response_type", "updateDate");

        Date oldDateFrom = dateFormat.parse(stringOldDateFrom);
        Date oldDateTo = dateFormat.parse(stringOldDateTo);

        Event currentDate = dateRepository.findByAccountIdAndDateFromAndDateTo(id, oldDateFrom, oldDateTo);
        if(currentDate != null) {
            Date newDateFrom = dateFormat.parse(stringNewDateFrom);
            Date newDateTo = dateFormat.parse(stringNewDateTo);

            if(!checkUniqueEvent(id, newDateFrom, newDateTo, currentDate.getId()) || newDateFrom.equals(newDateTo)) {
                response.put("success", false);
            } else {
                currentDate.setDateFrom(newDateFrom);
                currentDate.setDateTo(newDateTo);
                currentDate.setInfo(info);

                dateRepository.save(currentDate);

                response.put("success", true);
            }
        }
        else {
            response.put("success", false);
        }
        return response.toString();
    }

    @Transactional
    @ResponseBody
    @RequestMapping(method = RequestMethod.GET, value = "/greeting/deleteDate", produces = "application/json")
    public String deleteDate(@RequestParam(name = "accountId") Integer id,
                             @RequestParam(name = "dateFrom") String stringDateFrom,
                             @RequestParam(name = "dateTo") String stringDateTo) throws ParseException {
        JSONObject response = new JSONObject();
        response.put("response_type", "attemptDeleteDate");

        Date dateFrom = dateFormat.parse(stringDateFrom);
        Date dateTo = dateFormat.parse(stringDateTo);

        int changed = dateRepository.deleteByAccountIdAndDateFromAndDateTo(id, dateFrom, dateTo);

        if(changed == 1) {
            response.put("success", true);
        } else {
            response.put("success", false);
        }
        return response.toString();
    }

    private boolean checkUniqueEvent(Integer accountId, Date dateFrom, Date dateTo, Integer ignoredId) {
        List<Event> listOfOtherDatesInside = dateRepository.findByDateFromInsideOrDateToInside(accountId, ignoredId, dateFrom, dateTo);
        if(listOfOtherDatesInside.size() > 0) {
            return false;
        }

        List<Event> listOfDateInsideOthers = dateRepository.findThisEventInsideOther(accountId, ignoredId, dateFrom, dateTo);
        if(listOfDateInsideOthers.size() > 0) {
            return false;
        }

        return true;
    }

}

