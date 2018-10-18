package hello;
import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "dates")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "accountId")
    private Integer accountId;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_from")
    private Date dateFrom;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_to")
    private Date dateTo;

    @Column(name = "info")
    private String info;

    public Event() {}

    public Event(Integer accountId, Date dateFrom, Date dateTo, String info) {
        this.accountId = accountId;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        this.info = info;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(Date dateFrom) {
        this.dateFrom = dateFrom;
    }

    public Date getDateTo() {
        return dateTo;
    }

    public void setDateTo(Date dateTo) {
        this.dateTo = dateTo;
    }

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    @Override
    public String toString() {
        return "Event{" +
                "id=" + id +
                ", accountId=" + accountId +
                ", dateFrom=" + dateFrom +
                ", dateTo=" + dateTo +
                ", minutesTable='" + info + '\'' +
                '}';
    }
}
